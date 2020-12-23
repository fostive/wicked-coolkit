import { LightningElement, api } from 'lwc';
import DEFAULT_HOST from '../../../host';

export default class TradingCard extends LightningElement {
    displayName = null;
    description = null;
    imgSrc = null;
    link = null;
    strengths = null;

    @api host = DEFAULT_HOST;

    _stickers = [];
    get stickers() {
        return this._stickers.map((sticker) => ({
            id: sticker.id,
            href: `${this.host}/api/sticker/?id=${sticker.id}`,
            imgSrc: `./resources/images/stickers/${sticker.src}.svg`,
            imgAlt: sticker.alt || sticker.src
        }));
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

    connectedCallback() {
        this.fetchCard();
    }

    async fetchCard() {
        const res = await fetch(`${this.host}/api/tradingCard`);
        const {
            name,
            email,
            bio,
            link,
            img,
            twitter,
            codepen,
            instagram,
            github,
            linkedin,
            stickers,
            strengths
        } = await res.json();

        this.displayName = name;
        this.description = bio;
        this.imgSrc = img;
        this.strengths = strengths;

        this.link = link;

        this._email = email;
        this._twitter = twitter;
        this._codepen = codepen;
        this._instagram = instagram;
        this._github = github;
        this._linkedin = linkedin;

        this._stickers = stickers;
    }
}
