import Modal from 'react-modal';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dash.css';

Modal.setAppElement('#root'); // Set the app root element for accessibility

const GalleryForm = () => {
    const [galleryName, setGalleryName] = useState('');
    const [imageFiles, setImageFiles] = useState([]);
    const [galleries, setGalleries] = useState([]);
    const [selectedGalleryId, setSelectedGalleryId] = useState('');
    const [items, setItems] = useState([]);
    const [newGalleryCategory, setNewGalleryCategory] = useState('');
    const [imagePreview, setImagePreview] = useState('');
    const API_URL = process.env.REACT_APP_API_URL; // Fetch the API URL from environment variable

    // Fetch all galleries
    useEffect(() => {
        const fetchGalleries = async () => {
            try {
                const response = await axios.get('${API_URL}/api/gallery');
                setGalleries(response.data);
            } catch (error) {
                console.error('Error fetching galleries', error);
            }
        };

        fetchGalleries();
    }, []);

    // Fetch items for the selected gallery
    useEffect(() => {
        if (selectedGalleryId) {
            const fetchItems = async () => {
                try {
                    const response = await axios.get(`${API_URL}/api/gallery/${selectedGalleryId}`);
                    setItems(response.data.images || []);
                } catch (error) {
                    console.error('Error fetching items', error);
                }
            };

            fetchItems();
        }
    }, [selectedGalleryId]);

    // Handle adding a new gallery
    const handleAddGallery = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('${API_URL}/api/gallery', {
                name: galleryName,
                category: newGalleryCategory,
                images: []
            });
            if (response.status === 200) {
                alert('Gallery added successfully');
                setGalleryName('');
                setNewGalleryCategory('');
                const updatedResponse = await axios.get('${API_URL}/api/gallery');
                setGalleries(updatedResponse.data);
            }
        } catch (error) {
            console.error('Error adding gallery', error);
            alert('Failed to add gallery');
        }
    };

    // Handle adding items to a gallery
    const handleAddItemsToGallery = async (e) => {
        e.preventDefault();
        try {
            const items = await Promise.all(imageFiles.map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve({
                            id: new Date().getTime().toString(),
                            imageData: reader.result.split(',')[1] // Get base64 string
                        });
                    };
                    reader.readAsDataURL(file);
                });
            }));
            const response = await axios.post(`${API_URL}/api/gallery/${selectedGalleryId}/items`, items);
            if (response.status === 200) {
                alert('Items added to gallery successfully');
                setImageFiles([]);
                setImagePreview('');
                const updatedResponse = await axios.get(`${API_URL}/api/gallery/${selectedGalleryId}`);
                setItems(updatedResponse.data.images || []);
            }
        } catch (error) {
            console.error('Error adding items to gallery', error);
            alert('Failed to add items to gallery');
        }
    };

    // Handle deleting an item from a gallery
    const handleDeleteItem = async (itemId) => {
        try {
            const response = await axios.delete(`${API_URL}/api/gallery/${selectedGalleryId}/items/${itemId}`);
            if (response.status === 200) {
                alert('Item deleted successfully');
                const updatedResponse = await axios.get(`${API_URL}/api/gallery/${selectedGalleryId}`);
                setItems(updatedResponse.data.images || []);
            }
        } catch (error) {
            console.error('Error deleting item', error);
            alert('Failed to delete item');
        }
    };

    // Handle file input change
    const handleFileChange = (e) => {
        setImageFiles([...e.target.files]);
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file); // Preview image
        }
    };

    return (
        <div className="gallery-container">
            <h2>Gallery Management</h2>

            {/* Add Gallery Form */}
            <div className="form-section">
                <h3>Add New Gallery</h3>
                <form onSubmit={handleAddGallery} className="gallery-form">
                    <div className="form-group">
                        <label htmlFor="galleryName">Gallery Name:</label>
                        <input
                            id="galleryName"
                            type="text"
                            value={galleryName}
                            onChange={(e) => setGalleryName(e.target.value)}
                            required
                            className="form-control"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="galleryCategory">Gallery Category:</label>
                        <input
                            id="galleryCategory"
                            type="text"
                            value={newGalleryCategory}
                            onChange={(e) => setNewGalleryCategory(e.target.value)}
                            required
                            className="form-control"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary">Add Gallery</button>
                </form>
            </div>

            {/* Add Items to Gallery Form */}
            <div className="form-section">
                <h3>Add Items to Gallery</h3>
                <form onSubmit={handleAddItemsToGallery} className="gallery-form">
                    <div className="form-group">
                        <label htmlFor="gallerySelect">Select Gallery:</label>
                        <select
                            id="gallerySelect"
                            value={selectedGalleryId}
                            onChange={(e) => setSelectedGalleryId(e.target.value)}
                            required
                            className="form-control"
                        >
                            <option value="">Select Gallery</option>
                            {galleries.map((gallery) => (
                                <option key={gallery.id} value={gallery.id}>
                                    {gallery.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="imageFiles">Select Images:</label>
                        <input
                            id="imageFiles"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            multiple
                            className="form-control"
                        />
                        {imagePreview && (
                            <div className="image-preview">
                                <img
                                    src={imagePreview}
                                    alt={`Preview of uploaded image`}
                                    style={{ maxWidth: '100%', height: 'auto' }}
                                />
                            </div>
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary">Add Items</button>
                </form>
            </div>

            {/* Item List */}
            <div className="gallery-items">
                <h3>Items in Gallery</h3>
                <ul className="item-list">
                    {items.map((item) => (
                        <li key={item.id} className="item">
                            <img
                                src={`data:image/jpeg;base64,${item.imageData}`}
                                alt={`Item from gallery`}  // Updated alt attribute
                                className="item-image"
                            />
                            <div className="button-container">
                                <button onClick={() => handleDeleteItem(item.id)} className="btn btn-danger">Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default GalleryForm;
