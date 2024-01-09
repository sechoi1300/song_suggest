const mongoose = require('mongoose');

const AlbumSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    artist: {
        type: Array,
        required: true
    },
    released_date: {
        type: Date,
        required: true
    },
    length: {
        type: Number,
        required: true
    },
    num_of_songs: {
        type: Number,
        required: true
    },
    genres: {
        type: Array,
    },
    updated_date: {
        type: Date,
        default: Date.now
    }
});

module.exports = Album = mongoose.model('album', AlbumSchema);