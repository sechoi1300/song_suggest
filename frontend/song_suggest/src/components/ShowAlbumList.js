import React, { useState, useEffect } from 'react';
import '../App.css';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AlbumCard from './AlbumCard';

function ShowAlbumList() {
    const [albums, setAlbums] = useState([]);
  
    useEffect(() => {
        axios
            .get('http://localhost:8082/api/albums')
            .then((res) => {
                setAlbums(res.data);
            })
        .catch((err) => {
            console.log('Error from ShowAlbumList');
        });
    }, []);
  
    const albumList =
        albums.length === 0
            ? 'there is no album record!'
            : albums.map((album, k) => <AlbumCard album={album} key={k} />);
  
    return (
        <div className='ShowAlbumList'>
            <div className='container'>
                <div className='row'>
                    <div className='col-md-12'>
                        <br />
                        <h2 className='display-4 text-center'>Albums List</h2>
                    </div>
        
                    <div className='col-md-11'>
                        <Link
                            to='/create-album'
                            className='btn btn-outline-warning float-right'
                        >
                            + Add New Album
                        </Link>
                    <br />
                    <br />
                    <hr />
                </div>
            </div>
    
            <div className='list'>{albumList}</div>
            </div>
        </div>
    );
}
  
export default ShowAlbumList;