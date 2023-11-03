const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    guild_id: { type: String, required: true },
    random_quiz_channel: { type: String, default: '' },
    random_quiz_interval: { type: Number, default: 0 }, // In minutes (0 = disabled)
});

module.exports = mongoose.model('Guild', guildSchema);
