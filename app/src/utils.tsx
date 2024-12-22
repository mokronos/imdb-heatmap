const prepareData = (newData, prevData) => {
    if (!newData || !Array.isArray(newData) || !newData[0]) {
        return null;
    }


    var old_episodes = 0;
    var new_episodes = 0;

    var preparedData = [[]];
    var y_old = 0;

    if (prevData && Array.isArray(prevData) && prevData[0]) {
        y_old = prevData?.length || 0;
    }

    var y_new = newData?.length || 0;

    for (var i = 0; i < Math.max(y_new, y_old); i++) {
        var x_old = 0;
        var x_new = 0;

        if (prevData && prevData[i]) {
            x_old = prevData[i]?.length || 0;
        }

        if (newData[i]) {
            x_new = newData[i]?.length || 0;
        }

        var row = []

        var old_value = x_old === 0 ? 0 : i + 1;
        var new_value = x_new === 0 ? 0 : i + 1;

        row.push({
            "type": "seasondesc",
            "old": old_value,
            "new": new_value
        })

        var max_len = Math.max(x_new, x_old);
        old_episodes = Math.max(old_episodes, x_old);
        new_episodes = Math.max(new_episodes, x_new);

        for (var j = 0; j < max_len; j++) {
            var newValue = 0;
            if (newData[i] && newData[i][j]) {
                newValue = newData[i][j];
            }

            var oldValue = 0;
            if (prevData && prevData[i] && prevData[i][j]) {
                oldValue = prevData[i][j];
            }
            var payload = {
                "type": "episode",
                "old": oldValue,
                "new": newValue
            };
            row.push(payload);
        }

        preparedData.push(row);
    }

    var ep_desc = []

    ep_desc.push({
        "type": "corner",
        "value": "S\\E",
    })


    for (var i = 0; i < Math.max(old_episodes, new_episodes); i++) {
        var old_value = old_episodes > i ? i + 1 : 0;
        var new_value = new_episodes > i ? i + 1 : 0;
        var payload = {
            "type": "episodedesc",
            "old": old_value,
            "new": new_value
        }
        ep_desc.push(payload);
    }

    preparedData.unshift(ep_desc);


    return preparedData;
}

export { prepareData }
