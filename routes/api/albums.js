const express = require('express');
const router = express.Router();

const Album = require('../../models/Albums');

// @route   GET api/album/test
// @desc    Tests albums route
// @access  Public
router.get('/test', (req, res) => res.send('album route testing!'));

// @route   GET api/albums
// @desc    Get all albums
// @access  Public
router.get('/', (req, res) => {
    Album.find()
        .then(albums => res.json(albums))
        .catch(err => res.status(404).json({ noalbumsfound: 'No Albums found' }));
});

// @route   GET api/albums/:id
// @desc    Get single albums by id
// @access  Public
router.get('/:id', (req, res) => {
    Album.findById(req.params.id)
        .then(album => res.json(album))
        .catch(err => res.status(404).json({ noalbumsfound: 'No Albums found' }));
});

// @route   POST api/albums
// @desc    Add/save album
// @access  Public
router.post('/', (req, res) => {
    Album.create(req.body)
        .then(album => res.json({ msg: 'Album added successfully' }))
        .catch(err => res.status(400).json({ error: 'Unable to add this album' }));
});

