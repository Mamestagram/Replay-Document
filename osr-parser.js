const lzma = require("lzma");
const fs = require("fs");

const osrData = fs.readFileSync("../../resources/sample_std.osr");

let items = {}, item = 0;

const readByte = () => {
    return osrData.readUint8(item++);
}

const readShort = () => {
    let result = osrData.readUInt16LE(item);
    item += 2;
    return result;
}

const readInteger = () => {
    let result = osrData.readUInt32LE(item);
    item += 4;
    return result;
}

const readLong = () => {
    let result = osrData.readBigUint64LE(item);
    item += 8;
    return result;
}

const readULEB128 = () => {
    let result = 0;
    for (let i = 0; true; i++) {
        const byte = osrData.readUInt8(item++);
        result |= (byte & 0x7f) << i * 7;
        if ((byte & 0x80) === 0) break;
    }
    return result;
}

const readString = () => {
    let result;
    if (osrData.readUint8(item++) === 0x0b) {
        const bufSize = readULEB128();
        result = osrData.slice(item, item + bufSize).toString("utf8");
        item += bufSize;
    }
    else {
        result = "empty";
    }
    return result;
}

const readReplayData = (size) => {
    let result = new Uint8Array(osrData.slice(item, item + size));
    item += size;
    return result;
}

items.gamemode = readByte();
items.game_version = readInteger();
items.map_md5 = readString();
items.username = readString();
items.replay_md5 = readString();
items.n300 = readShort();
items.n100 = readShort();
items.n50 = readShort();
items.ngeki = readShort();
items.nkatu = readShort();
items.nmiss = readShort();
items.score = readInteger();
items.max_combo = readShort();
items.perfect = readByte();
items.mods = readInteger();
items.life_bar = readString();
items.timestamp = readLong();
items.replay_length = readInteger();
items.replay_data = readReplayData(items.replay_length);
items.score_id = readLong();

console.log(items);

lzma.decompress(items.replay_data, (result) => {
    items.replay_data = result;
});