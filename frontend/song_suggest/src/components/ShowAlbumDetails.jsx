import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import '../App.css';
import axios from 'axios';

function ShowAlbumDetails(props) {
    const [album, setAlbum] = useState({});

    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        axios
            .get(`http://localhost:8082/api/albums/${id}`)
            .then((res) => {
                setAlbum(res.data);
            })
            .catch((err) => {
                console.log('Error from ShowAlbumDetails');
            });
    }, [id]);

    const onDeleteClick = (id) => {
        axios
            .delete(`http://localhost:8082/api/albums/${id}`)
            .then((res) => {
                navigate('/');
            })
            .catch((err) => {
                console.log('Error form ShowAlbumDetails_deleteClick');
            });
    };

    const AlbumItem = (
        <div>
            <table className='table table-hover table-dark'>
                <tbody>
                    <tr>
                        <th scope='row'>1</th>
                        <td>Title</td>
                        <td>{album.title}</td>
                    </tr>
                    <tr>
                        <th scope='row'>2</th>
                        <td>artist</td>
                        <td>
                            {Array.isArray(album.artist)
                                ? album.artist.join(', ')
                                : album.artist
                            }
                        </td>
                    </tr>
                    <tr>
                        <th scope='row'>3</th>
                        <td>Release Date</td>
                        <td>{new Date(album.released_date).toLocaleDateString()}</td>
                    </tr>
                    <tr>
                        <th scope='row'>4</th>
                        <td>Length</td>
                        <td>{album.length}</td>
                    </tr>
                    <tr>
                        <th scope='row'>5</th>
                        <td>Number of Songs</td>
                        <td>{album.num_of_songs}</td>
                    </tr>
                    <tr>
                        <th scope='row'>6</th>
                        <td>Genres</td>
                        <td>
                            {Array.isArray(album.genres)
                                ? album.genres.join(', ')
                                : album.genres
                            }
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );

    return (
        <div className='ShowAlbumDetails'>
            <div className='container'>
                <div className='row'>
                    <div className='col-md-10 m-auto'>
                        <br /> <br />
                        <Link to='/' className='btn btn-outline-warning float-left'>
                            Show Album List
                        </Link>
                    </div>
                    <br />
                    <div className='col-md-8 m-auto'>
                        <h1 className='display-4 text-center'>Album Record</h1>
                        <p className='lead text-center'>View Album Info</p>
                        <hr /> <br />
                    </div>
                    <div className='col-md-10 m-auto'>{AlbumItem}</div>
                    <div className='col-md-6 m-auto'>
                        <button
                            type='button'
                            className='btn btn-outline-danger btn-lg btn-block'
                            onClick={() => {
                                onDeleteClick(album._id);
                            }}
                        >
                            Delete Album
                        </button>
                    </div>
                    <div className='col-md-6 m-auto'>
                        <Link
                            to={`/edit-album/${album._id}`}
                            className='btn btn-outline-info btn-lg btn-block'
                        >
                            Edit Album
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ShowAlbumDetails;