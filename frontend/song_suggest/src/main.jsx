import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css'

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";

import CreateAlbum from "./components/CreateAlbum";
import ShowAlbumList from "./components/ShowAlbumList";
import ShowAlbumDetails from "./components/ShowAlbumDetails";
import UpdateAlbumInfo from "./components/UpdateAlbumInfo";

const router = createBrowserRouter([
  { path: "/", element: <ShowAlbumList /> },
  { path: "/create-album", element: <CreateAlbum /> },
  { path: "/show-album/:id", element: <ShowAlbumDetails /> },
  { path: "/edit-album/:id", element: <UpdateAlbumInfo /> },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
