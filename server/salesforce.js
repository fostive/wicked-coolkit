const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getContact = async (sf) => {
    const c = await sf
        .query(
            `SELECT Id, Name, Email, Bio__c, Picture_Content_Version_ID__c, Feats_of_Strength__c,
            Main_Website__c, Twitter_Username__c, Instagram_Username__c, GitHub_Username__c, LinkedIn_Username__c, CodePen_Username__c
            FROM Contact
            LIMIT 1`
        )
        .then(({ records }) => records[0]);

    const websiteUrl = await sf
        .query(
            `SELECT URL__c
            FROM Website__c
            WHERE Id = '${c.Main_Website__c}'`
        )
        .then(({ records }) => records[0].URL__c);

    return {
        id: c.Id,
        name: c.Name,
        email: c.Email,
        bio: c.Bio__c,
        pictureId: c.Picture_Content_Version_ID__c,
        strengths: c.Feats_of_Strength__c.split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        website: websiteUrl,
        twitter: c.Twitter_Username__c,
        instagram: c.Instagram_Username__c,
        github: c.GitHub_Username__c,
        linkedin: c.LinkedIn_Username__c,
        codepen: c.CodePen_Username__c
    };
};

const getStickers = (sf, id) => {
    return sf
        .query(
            `SELECT Id, Name, Image_Alt_Text__c
        FROM Sticker__c
        WHERE Id IN
        (SELECT Sticker__c
        FROM Contact_Sticker_Association__c
        WHERE Contact__c = '${id}')`
        )
        .then(({ records }) => records)
        .then((stickers) =>
            stickers.map((sticker) => ({
                // TODO: use new column names for name and alt text
                id: sticker.Id,
                path: sticker.Name,
                alt: sticker.Image_Alt_Text__c
            }))
        );
};

const getWebsite = (sf, websiteId) => {
    return sf
        .query(
            `SELECT URL__c
        FROM Website__c
        WHERE Id = '${websiteId}'`
        )
        .then(({ records }) => records[0])
        .then((website) => ({ url: website.URL_c }));
};

const getImage = async (sf, imageId) => {
    const [imageMeta, imageBlob] = await Promise.all([
        sf
            .request(
                `/services/data/v50.0/sobjects/ContentDocument/${imageId}/LatestPublishedVersion`
            )
            // TODO: remove catch
            .catch(() => ({ FileType: 'png' })),
        sf
            .request(
                `/services/data/v50.0/sobjects/ContentDocument/${imageId}/LatestPublishedVersion/VersionData`
            )
            // TODO: remove catch
            .catch(
                () =>
                    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAaGVYSWZNTQAqAAAACAAEAQYAAwAAAAEAAgAAARIAAwAAAAEAAQAAASgAAwAAAAEAAgAAh2kABAAAAAEAAAA+AAAAAAADoAEAAwAAAAEAAQAAoAIABAAAAAEAAAABoAMABAAAAAEAAAABAAAAAHvdGMUAAALgaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA1LjQuMCI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIgogICAgICAgICAgICB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyI+CiAgICAgICAgIDx0aWZmOlBob3RvbWV0cmljSW50ZXJwcmV0YXRpb24+MjwvdGlmZjpQaG90b21ldHJpY0ludGVycHJldGF0aW9uPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpDb21wcmVzc2lvbj4xPC90aWZmOkNvbXByZXNzaW9uPgogICAgICAgICA8dGlmZjpSZXNvbHV0aW9uVW5pdD4yPC90aWZmOlJlc29sdXRpb25Vbml0PgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+MTwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOkNvbG9yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+MTwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgrdUqUcAAAADUlEQVQIHWPYf/bufwAIIQNpUz6zkQAAAABJRU5ErkJggg=='
            )
    ]);

    return `data:image/${imageMeta.FileType};base64,${imageBlob}`;
};

const getRandomWebringForContact = async (sf, contactId) => {
    const randomWebsite = await sf
        .query(
            `SELECT URL__c
            FROM Website__c
            WHERE Contact__c = '${contactId}'`
        )
        .then(({ records }) => random(records));

    return randomWebsite.URL__c;
};

const getRandomWebringForSticker = async (sf, stickerId) => {
    const webringId = await sf
        .query(
            `SELECT Id
            FROM Webring__c
            WHERE Sticker__c = '${stickerId}'`
        )
        .then(({ records }) => records[0].Id);

    const randomWebsite = await sf
        .query(
            `SELECT URL__c
            FROM Website__c
            WHERE Id IN
            (SELECT Website__c
            FROM Website_Webring_Association__c
            WHERE Webring__c = '${webringId}')`
        )
        .then(({ records }) => random(records));

    return randomWebsite.URL__c;
};

const getWebring = async (sf) => {
    const contact = await getContact(sf);

    const webring = await sf
        .query(
            `SELECT Webring__r.Id, Webring__r.Name, Webring__r.Description__c, Webring__r.Sticker__c
            FROM Contact
            WHERE Id = '${contact.id}'`
        )
        .then(({ records }) => records[0].Webring__r);

    return {
        url: contact.website,
        name: webring.Name,
        description: webring.Description__c
    };
};

module.exports = {
    getContact,
    getStickers,
    getWebsite,
    getImage,
    getWebring,
    getRandomWebringForContact,
    getRandomWebringForSticker
};
