import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const AlbumCard = ({album}) => {

    return (
        <div className='card-container'>
        <img
            src='https://images.unsplash.com/photo-1495446815901-a7297e633e8d'
            alt='Albums'
            height={200}
        />
        <div className='desc'>
            <h2>
                <Link to={`/show-album/${album._id}`}>{album.title}</Link>
            </h2>
            <h3>
                {Array.isArray(album.artist)
                    ? album.artist.join(', ')
                    : album.artist
                }
            </h3>
            <p>{album.released_date}</p>
        </div>
        </div>
    );
};

export default AlbumCard;
