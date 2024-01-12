import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

function UpdateAlbumInfo(props) {
  const [album, setAlbum] = useState({
    title: "",
    artist: [],
    released_date: "",
    length: "",
    num_of_songs: "",
    genres: "",
  });

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`http://localhost:8082/api/albums/${id}`)
      .then((res) => {
        setAlbum({
          title: res.data.title,
          artist: res.data.artist,
          released_date: res.data.released_date,
          length: res.data.length,
          num_of_songs: res.data.num_of_songs,
          genres: res.data.genres,
        });
      })
      .catch((err) => {
        console.log('Error from UpdateAlbumInfo');
      });
  }, [id]);

  const onChange = (e) => {
    setAlbum({ ...album, [e.target.name]: e.target.value });
  };

  const onSubmit = (e) => {
    e.preventDefault();

    const data = {
      title: album.title,
      artist: album.artist,
      released_date: album.released_date,
      length: album.length,
      num_of_songs: album.num_of_songs,
      genres: album.genres,
    };

    axios
      .put(`http://localhost:8082/api/albums/${id}`, data)
      .then((res) => {
        navigate(`/show-album/${id}`);
      })
      .catch((err) => {
        console.log('Error in UpdateAlbumInfo!');
      });
  };

  return (
    <div className='UpdateAlbumInfo'>
      <div className='container'>
        <div className='row'>
          <div className='col-md-8 m-auto'>
            <br />
            <Link to='/' className='btn btn-outline-warning float-left'>
              Show Album List
            </Link>
          </div>
          <div className='col-md-8 m-auto'>
            <h1 className='display-4 text-center'>Edit Album</h1>
            <p className='lead text-center'>Update Album Info</p>
          </div>
        </div>

        <div className='col-md-8 m-auto'>
          <form noValidate onSubmit={onSubmit}>
            <div className='form-group'>
              <label htmlFor='title'>Title</label>
              <input
                type='text'
                placeholder='Title of the Album'
                name='title'
                className='form-control'
                value={album.title}
                onChange={onChange}
              />
            </div>
            <br />

            <div className='form-group'>
              <label htmlFor='artist'>Artist</label>
              <input
                type='text'
                placeholder='Artist'
                name='artist'
                className='form-control'
                value={album.artist}
                onChange={onChange}
              />
            </div>
            <br />

            <div className='form-group'>
              <label htmlFor='released_date'>Release Date</label>
              <input
                type='date'
                placeholder='Release Date'
                name='released_date'
                className='form-control'
                value={album.released_date}
                onChange={onChange}
              />
            </div>
            <br />

            <div className='form-group'>
              <label htmlFor='length'>Length</label>
              <input
                type='text'
                placeholder='Length of the Album'
                name='length'
                className='form-control'
                value={album.length}
                onChange={onChange}
              />
            </div>
            <br />

            <div className='form-group'>
              <label htmlFor='num_of_songs'>Number of Songs</label>
              <input
                type='number'
                placeholder='Number of Songs'
                name='num_of_songs'
                className='form-control'
                value={album.num_of_songs}
                onChange={onChange}
              />
            </div>
            <br />

            <div className='form-group'>
              <label htmlFor='genres'>Genres</label>
              <input
                type='text'
                placeholder='Genres'
                name='genres'
                className='form-control'
                value={album.genres}
                onChange={onChange}
              />
            </div>
            <br />

            <button
              type='submit'
              className='btn btn-outline-info btn-lg btn-block'
            >
              Update Album
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UpdateAlbumInfo;