import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CreateAlbum = (props) => {
    const navigate = useNavigate();

    const [album, setAlbum] = useState({
        title: "",
        artist: [],
        released_date: "",
        length: "",
        num_of_songs: "",
        genres: "",
        updated_date: "",
    });

    const onChange = (e) => {
        setAlbum({ ...album, [e.target.name]: e.target.value });
    };

    const onSubmit = (e) => {
        e.preventDefault();
        axios
            .post("http://localhost:8082/api/albums", album)
            .then((res) => {
                setAlbum({
                    title: "",
                    artist: [],
                    released_date: "",
                    length: "",
                    num_of_songs: "",
                    genres: "",
                    updated_date: "",
                });
            navigate("/");
            })
            .catch((err) => {
                console.log("Error in CreateAlbum!");
            });
    };

    return (
        <div className="CreateAlbum">
            <div className="container">
                <div className="row">
                    <div className="col-md-8 m-auto">
                        <br />
                        <Link to="/" className="btn btn-outline-warning float-left">
                            Show Album List
                        </Link>
                    </div>
                    <div className="col-md-10 m-auto">
                        <h1 className="display-4 text-center">Add Album</h1>
                        <p className="lead text-center">Create new album</p>
                        <form noValidate onSubmit={onSubmit}>
                            <div className="form-group">
                                <input
                                    type="text"
                                    placeholder="Title of the Album"
                                    name="title"
                                    className="form-control"
                                    value={album.title}
                                    onChange={onChange}
                                />
                            </div>
                            <br />
                            <div className="form-group">
                                <input
                                    type="text"
                                    placeholder="Artist"
                                    name="artist"
                                    className="form-control"
                                    value={album.artist}
                                    onChange={onChange}
                                />
                            </div>
                            <br />
                            <div className="form-group">
                                <input
                                    type="date"
                                    placeholder="Release Date"
                                    name="released_date"
                                    className="form-control"
                                    value={album.released_date}
                                    onChange={onChange}
                                />
                            </div>
                            <br />
                            <div className="form-group">
                                <input
                                    type="text"
                                    placeholder="Length of Album"
                                    name="length"
                                    className="form-control"
                                    value={album.length}
                                    onChange={onChange}
                                />
                            </div>
                            <br />
                            <div className="form-group">
                                <input
                                    type="number"
                                    placeholder="Number of Songs"
                                    name="num_of_songs"
                                    className="form-control"
                                    value={album.num_of_songs}
                                    onChange={onChange}
                                />
                            </div>
                            <br />
                            <div className="form-group">
                                <input
                                    type="text"
                                    placeholder="Genres"
                                    name="genres"
                                    className="form-control"
                                    value={album.genres}
                                    onChange={onChange}
                                />
                            </div>
                            <br />
                            <div className="form-group">
                                <input
                                    type="date"
                                    placeholder="Updated Date"
                                    name="updated_date"
                                    className="form-control"
                                    value={album.updated_date}
                                    onChange={onChange}
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-outline-warning btn-block mt-4 mb-4 w-100"
                            >
                                Submit
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
    
export default CreateAlbum;