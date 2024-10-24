import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import './Dash.css';

Modal.setAppElement('#root'); // Set the app root element for accessibility

const FacilityList = () => {
    const [facilities, setFacilities] = useState([]);
    const [newFacility, setNewFacility] = useState({ heading: '', description: '', image: '' });
    const [editFacility, setEditFacility] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const API_URL = process.env.REACT_APP_API_URL; // Fetch the API URL from environment variable

    useEffect(() => {
        fetchFacilities();
    }, []);

    const fetchFacilities = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/facility`); // Using the API_URL
            console.log('Fetched facilities:', response.data); // Log the response data
            setFacilities(response.data);
        } catch (error) {
            console.error('Error fetching facilities:', error);
        }
    };

    const handleAddFacility = async () => {
        if (newFacility.heading && newFacility.description && newFacility.image) {
            try {
                const response = await axios.post(`${API_URL}/api/facility`, newFacility); // Using the API_URL
                setFacilities([...facilities, response.data]);
                setNewFacility({ heading: '', description: '', image: '' });
                setIsAddModalOpen(false);
                alert('Facility added successfully!');
            } catch (error) {
                console.error('Error adding facility:', error);
            }
        } else {
            alert('Please fill out all fields and upload an image.');
        }
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this facility?");
        if (confirmDelete) {
            try {
                await axios.delete(`${API_URL}/api/facility/${id}`); // Using the API_URL
                setFacilities(facilities.filter(facility => facility.id !== id));
                alert('Facility deleted successfully!');
            } catch (error) {
                console.error('Error deleting facility:', error);
            }
        }
    };

    const handleEdit = (id) => {
        const facilityToEdit = facilities.find(facility => facility.id === id);
        setEditFacility(facilityToEdit);
        setIsEditModalOpen(true);
    };

    const handleUpdateFacility = async () => {
        if (editFacility.heading && editFacility.description && editFacility.image) {
            try {
                const response = await axios.put(`${API_URL}/api/facility/${editFacility.id}`, editFacility); // Using the API_URL
                setFacilities(facilities.map(facility =>
                    facility.id === editFacility.id ? response.data : facility
                ));
                setEditFacility(null);
                setIsEditModalOpen(false);
                alert('Facility updated successfully!');
            } catch (error) {
                console.error('Error updating facility:', error);
            }
        } else {
            alert('Please fill out all fields and upload an image.');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewFacility({ ...newFacility, [name]: value });
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFacility({ ...editFacility, [name]: value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewFacility({ ...newFacility, image: reader.result.split(',')[1] }); // Store base64 string
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditFacility({ ...editFacility, image: reader.result.split(',')[1] }); // Store base64 string
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="table-container">
            <h1>Manage Facilities</h1>
            <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">Add New Facility</button>

            <table>
                <thead>
                    <tr>
                        <th>Heading</th>
                        <th>Description</th>
                        <th>Image</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {facilities.map((facility) => (
                        <tr key={facility.id}>
                            <td>{facility.heading}</td>
                            <td>{facility.description}</td>
                            <td>
                                {facility.image && (
                                    <img
                                        src={`data:image/jpeg;base64,${facility.image}`}
                                        alt={facility.heading}
                                        className="facility-cover-image"
                                    />
                                )}
                            </td>
                            <td>
                                <button onClick={() => handleEdit(facility.id)} className="btn-edit-item">Edit</button>
                                <button onClick={() => handleDelete(facility.id)} className="btn-delete-item">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Add Facility Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onRequestClose={() => setIsAddModalOpen(false)}
                contentLabel="Add Facility"
                className="Modal"
                overlayClassName="Overlay"
            >
                <h2>Add New Facility</h2>
                <input
                    type="text"
                    name="heading"
                    placeholder="Heading"
                    value={newFacility.heading}
                    onChange={handleInputChange}
                />
                <input
                    type="text"
                    name="description"
                    placeholder="Description"
                    value={newFacility.description}
                    onChange={handleInputChange}
                />
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                />
                <button onClick={handleAddFacility}>Add Facility</button>
                <button onClick={() => setIsAddModalOpen(false)}>Cancel</button>
            </Modal>

            {/* Edit Facility Modal */}
            {editFacility && (
                <Modal
                    isOpen={isEditModalOpen}
                    onRequestClose={() => setIsEditModalOpen(false)}
                    contentLabel="Edit Facility"
                    className="Modal"
                    overlayClassName="Overlay"
                >
                    <h2>Edit Facility</h2>
                    <input
                        type="text"
                        name="heading"
                        placeholder="Heading"
                        value={editFacility.heading}
                        onChange={handleEditInputChange}
                    />
                    <input
                        type="text"
                        name="description"
                        placeholder="Description"
                        value={editFacility.description}
                        onChange={handleEditInputChange}
                    />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageChange}
                    />
                    <button className="btn-edit-item" onClick={handleUpdateFacility}>Update Facility</button>
                    <button className="btn-delete-item" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                </Modal>
            )}
        </div>
    );
};

export default FacilityList;
