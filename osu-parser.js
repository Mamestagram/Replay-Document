const fs = require("fs");
let osuData;

const osuParser = (osuFile) => {
    osuData = fs.readFileSync(osuFile, "utf8");
    let items = {
        General: {
            AudioFilename: "",
            AudioLeadIn: 0,
            AudioHash: "",
            PreviewTime: -1,
            Countdown: 1,
            SampleSet: "Normal",
            StackLeniency: 0.7,
            Mode: 0,
            LetterboxInBreaks: 0,
            StoryFireInFront: 1,
            UseSkinSprites: 0,
            AlwaysShowPlayfield: 0,
            OverlayPosition: "NoChange",
            SkinPreference: "",
            EpilepsyWarning: 0,
            CountdownOffset: 0,
            SpecialStyle: 0,
            WidescreenStoryboard: 0,
            SamplesMatchPlaybackRate: 0
        },
        Editor: {},
        Metadata: {},
        Difficulty: {},
        Events: {
            backgrounds: {},
            videos: {},
            breaks: []
        },
        TimingPoints: [],
        Colours: {},
        HitObjects: []
    }
    let section = null;

    for (let line of osuData.split("\n")) {
        if (line.trim() !== "") {
            switch (line.trim()) {
                case "[General]":
                case "[Editor]":
                case "[Metadata]":
                case "[Difficulty]":
                case "[Events]":
                case "[TimingPoints]":
                case "[Colours]":
                case "[HitObjects]":
                    section = line.trim().match(/\w+/)[0];
                    break;
                default:
                    let item;
                    switch (section) {
                        case "General":
                            item = line.trim().split(":").map(term => term.trim());
                            switch (item[0]) {
                                case "AudioLeadIn":
                                case "PreviewTime":
                                case "Countdown":
                                case "Mode":
                                case "LetterboxInBreaks":
                                case "StoryFireInFront":
                                case "UseSkinSprites":
                                case "AlwaysShowPlayfield":
                                case "EpilepsyWarning":
                                case "CountdownOffset":
                                case "SpecialStyle":
                                case "WidescreenStoryboard":
                                case "SamplesMatchPlaybackRate":
                                    item[1] = parseInt(item[1])
                                    break;
                                case "StackLeniency":
                                    item[1] = parseFloat(item[1]);
                                    break;
                            }
                            items[section][item[0]] = item[1];
                            break;
                        case "Editor":
                            item = line.trim().split(":").map(term => term.trim());
                            switch (item[0]) {
                                case "Bookmarks":
                                    item[1] = item[1].split(",").map(val => parseInt(val));
                                    break;
                                case "BeatDivisor":
                                case "GridSize":
                                    item[1] = parseInt(item[1]);
                                    break;
                                case "DistanceSpacing":
                                case "TimelineZoom":
                                    item[1] = parseFloat(item[1]);
                                    break;
                            }
                            items[section][item[0]] = item[1];
                            break;
                        case "Metadata":
                            item = line.trim().split(":").map(term => term.trim());
                            switch (item[0]) {
                                case "Tags":
                                    item[1] = item[1].split(" ");
                                    break;
                                case "BeatmapID":
                                case "BeatmapSetID":
                                    item[1] = parseInt(item[1]);
                                    break;
                            }
                            items[section][item[0]] = item[1];
                            break;
                        case "Difficulty":
                            item = line.trim().split(":").map(term => term.trim());
                            item[1] = parseFloat(item[1]);
                            items[section][item[0]] = item[1];
                            break;
                        case "Colours":
                            item = line.trim().split(":").map(term => term.trim());
                            items[section][item[0]] = {
                                r: parseInt(item[1].split(",")[0]),
                                g: parseInt(item[1].split(",")[1]),
                                b: parseInt(item[1].split(",")[2])
                            };
                            break;
                        case "Events":
                            item = line.trim().split(",");
                            switch (item[0]) {
                                case "0":
                                    items[section].backgrounds.startTime = item[1];
                                    items[section].backgrounds.filename = item[2].match(/(?<=").+(?=")/)[0];
                                    items[section].backgrounds.xOffset = item[3];
                                    items[section].backgrounds.yOffset = item[4];
                                    break;
                                case "Video":
                                    items[section].videos.startTime = item[1];
                                    items[section].videos.filename = item[2].match(/(?<=").+(?=")/)[0];
                                    items[section].videos.xOffset = item[3];
                                    items[section].videos.yOffset = item[4];
                                    break;
                                case "2":
                                case "Break":
                                    items[section].breaks.push({
                                        startTime: item[1],
                                        endTime: item[2],
                                    });
                            }
                            break;
                        case "TimingPoints":
                            item = line.trim().split(",");
                            items[section].push({
                                time: parseInt(item[0]),
                                beatLength: parseFloat(item[1]),
                                meter: parseInt(item[2]),
                                sampleSet: parseInt(item[3]),
                                sampleIndex: parseInt(item[4]),
                                volume: parseInt(item[5]),
                                uninherited: parseInt(item[6]),
                                effects: parseInt(item[7]),
                            });
                            break;
                        case "HitObjects":
                            item = line.trim().split(",");
                            // sliders
                            if ((parseInt(item[3]) & 1 << 1) > 0) {
                                item[5] = item[5].split("|").map((val) => {
                                    if (val.split(":").length > 1) {
                                        return {
                                            x: parseInt(val.split(":")[0]),
                                            y: parseInt(val.split(":")[1])
                                        };
                                    }
                                    else {
                                        return val;
                                    }
                                });
                                if (item.length < 9) {
                                    let textVal = [ "", "", "" ];
                                    for (let i = 0; i < item[5].length - 1; i++) {
                                        textVal[0] += "0|";
                                        textVal[1] += "0:0|";
                                    }
                                    textVal[0] = textVal[0].slice(0, textVal[0].length - 1);
                                    textVal[1] = textVal[1].slice(0, textVal[1].length - 1);
                                    textVal[2] = "0:0:0:0:";
                                    for (let i = 0; i < textVal.length; i++) {
                                        item.push(textVal[i]);
                                    }
                                }
                                item[8] = item[8].split("|").map((val) => {
                                    return parseInt(val);
                                });
                                item[9] = item[9].split("|").map((val) => {
                                    return {
                                        normalSet: parseInt(val.split(":")[0]),
                                        additionSet: parseInt(val.split(":")[1])
                                    };
                                });
                                item[10] = item[10].split(":");
                                items[section].push({
                                    x: parseInt(item[0]),
                                    y: parseInt(item[1]),
                                    time: parseInt(item[2]),
                                    type: parseInt(item[3]),
                                    hitSound: parseInt(item[4]),
                                    sliderOptions: {
                                        curveType: item[5][0],
                                        curvePoints: item[5].slice(1, item[5].length),
                                        slides: parseInt(item[6]),
                                        length: parseFloat(item[7]),
                                        edgeSounds: [item[8]],
                                        edgeSets: [item[9]],
                                    },
                                    hitSample: {
                                        normalSet: parseInt(item[10][0]),
                                        additionSet: parseInt(item[10][1]),
                                        index: parseInt(item[10][2]),
                                        volume: parseInt(item[10][3]),
                                        filename: item[10][4],
                                    }
                                });
                            }
                            // spinners
                            if ((parseInt(item[3]) & 1 << 3) > 0) {
                                if (item.length < 7) {
                                    item.push("0:0:0:0:");
                                }
                                item[6] = item[6].split(":");
                                items[section].push({
                                    x: parseInt(item[0]),
                                    y: parseInt(item[1]),
                                    time: parseInt(item[2]),
                                    type: parseInt(item[3]),
                                    hitSound: parseInt(item[4]),
                                    endTime: parseInt(item[5]),
                                    hitSample: {
                                        normalSet: parseInt(item[6][0]),
                                        additionSet: parseInt(item[6][1]),
                                        index: parseInt(item[6][2]),
                                        volume: parseInt(item[6][3]),
                                        filename: item[6][4],
                                    }
                                });
                            }
                            // holds (mania only)
                            if ((parseInt(item[3]) & 1 << 7) > 0) {
                                item[5] = item[5].split(":");
                                for (let i = 6; i > item[5].length; i--) {
                                    if (i === 2) {
                                        item[5].push("");
                                    }
                                    else {
                                        item[5].push("0");
                                    }
                                }
                                items[section].push({
                                    x: parseInt(item[0]),
                                    y: parseInt(item[1]),
                                    time: parseInt(item[2]),
                                    type: parseInt(item[3]),
                                    hitSound: parseInt(item[4]),
                                    endTime: parseInt(item[5][0]),
                                    hitSample: {
                                        normalSet: parseInt(item[5][1]),
                                        additionSet: parseInt(item[5][2]),
                                        index: parseInt(item[5][3]),
                                        volume: parseInt(item[5][4]),
                                        filename: item[5][5],
                                    }
                                });
                            }
                            // hit circles
                            if ((parseInt(item[3]) & 1 << 0) > 0) {
                                if (item.length < 6) {
                                    item.push("0:0:0:0:");
                                }
                                item[5] = item[5].split(":");
                                items[section].push({
                                    x: parseInt(item[0]),
                                    y: parseInt(item[1]),
                                    time: parseInt(item[2]),
                                    type: parseInt(item[3]),
                                    hitSound: parseInt(item[4]),
                                    hitSample: {
                                        normalSet: parseInt(item[5][0]),
                                        additionSet: parseInt(item[5][1]),
                                        index: parseInt(item[5][2]),
                                        volume: parseInt(item[5][3]),
                                        filename: item[5][4],
                                    }
                                });
                            }
                            break;
                    }
            }
        }
    }

    return items;
}
module.exports = {
    parse: osuParser
};