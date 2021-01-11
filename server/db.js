module.exports.getHits = async (pg, site) => {
    const hits = await pg.oneOrNone(
        'SELECT count from hit_counter WHERE site = $1',
        [site]
    );
    return hits || { count: 0 };
};

module.exports.incrementHits = async (pg, site) => {
    const updated = await pg.result(
        'UPDATE hit_counter SET count = count + 1 WHERE site = $1',
        [site]
    );

    if (updated.rowCount === 0) {
        await pg.none('INSERT INTO hit_counter(site, count) VALUES($1, $2)', [
            site,
            1
        ]);
    }
};
