const express = require('express');
const router = express.Router();

const Album = require('../../models/model_album');

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

// @route   PUT api/albums/:id
// @desc    Update book by id
// @access  Public
router.put('/:id', (req, res) => {
    Album.findByIdAndUpdate(req.params.id, req.body)
        .then(album => res.json({ msg: 'Updated successfully' }))
        .catch(err =>
            res.status(400).json({ error: 'Unable to update the Database' })
        );
});

// @route   DELETE api/albums/:id
// @desc    Delete album by id
// @access  Public
router.delete('/:id', (req, res) => {
    Album.findByIdAndDelete(req.params.id)
        .then(album => res.json({ mgs: 'Album entry deleted successfully' }))
        .catch(err => res.status(404).json({ error: 'No such album' }));
});
  
module.exports = router;