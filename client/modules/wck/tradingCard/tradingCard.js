import { LightningElement, api } from "lwc";
import * as util from "../../util";

export default class TradingCard extends LightningElement {
  displayName = null;
  description = null;
  imgSrc = null;
  website = null;
  strengths = null;
  loading = true;
  loadingSticker = false;

  @api host = null;

  _stickers = [];
  get stickers() {
    return this._stickers.map((sticker) => ({
      id: sticker.id,
      href: `${util.api(this.host)}/sticker/?name=${encodeURIComponent(
        sticker.path
      )}`,
      imgSrc: util.sticker(sticker.path),
      imgAlt: sticker.alt,
    }));
  }

  onStickerClick(e) {
    // Only for regular clicks
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return;
    }

    this.loadingSticker = true;
  }

  closeOverlay() {
    this.loadingSticker = false;
  }

  get email() {
    if (this._email) {
      return `mailto:${this._email}`;
    }
    return false;
  }

  get twitter() {
    if (this._twitter) {
      return `https://twitter.com/${this._twitter}`;
    }
    return false;
  }

  get codepen() {
    if (this._codepen) {
      return `https://codepen.io/${this._codepen}`;
    }
    return false;
  }

  get github() {
    if (this._github) {
      return `https://github.com/${this._github}`;
    }
    return false;
  }

  get linkedin() {
    if (this._linkedin) {
      return `https://www.linkedin.com/in/${this._linkedin}`;
    }
    return false;
  }

  get instagram() {
    if (this._instagram) {
      return `https://www.instagram.com/${this._instagram}`;
    }
    return false;
  }

  get hasLinks() {
    return (
      [
        this.email,
        this.twitter,
        this.codepen,
        this.github,
        this.linkedin,
        this.instagram,
        this.website,
      ].filter(Boolean).length > 0
    );
  }

  _error = null;
  get error() {
    return this._error;
  }

  set error(e) {
    this._error = e;
    // eslint-disable-next-line @lwc/lwc/no-inner-html
    this.template.querySelector(".error-message").innerHTML = e || "";
  }

  connectedCallback() {
    this.fetchCard();
  }

  async fetchCard() {
    const [data, error] = await util.fetchInitial(this, "/tradingCard");

    if (error) {
      this.error = error;
      return;
    }

    this.error = null;

    this.displayName = data.name;
    this.description = data.bio;
    this.imgSrc = data.img;
    this.strengths = data.strengths;

    this.website = data.website;
    this._email = data.email;
    this._twitter = data.twitter;
    this._codepen = data.codepen;
    this._instagram = data.instagram;
    this._github = data.github;
    this._linkedin = data.linkedin;

    this._stickers = data.stickers;
  }
}
