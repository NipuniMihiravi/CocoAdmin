import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import './Dash.css';

Modal.setAppElement('#root'); // Accessibility setup

const ContactList = () => {
    const [contacts, setContacts] = useState([]);
    const [editContact, setEditContact] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const API_URL = 'https://cocobackendrender.onrender.com/contact';

    useEffect(() => {
        fetchContacts();

        const intervalId = setInterval(() => {
            axios.get(API_URL)
                .then(() => console.log('Ping successful'))
                .catch(error => console.error('Ping failed:', error));
        }, 300000); // Ping every 5 minutes

        return () => clearInterval(intervalId);
    }, []);

    const fetchContacts = async () => {
        try {
            const response = await axios.get(API_URL);
            console.log('Fetched Data:', response.data); // Log response data
            const sortedContacts = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setContacts(sortedContacts);
        } catch (error) {
            console.error('Error fetching contacts:', error.message);
        }
    };

    const handleDelete = async (_id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this contact?");
        if (confirmDelete) {
            try {
                await axios.delete(`${API_URL}/${_id}`);
                setContacts(contacts.filter(contact => contact._id !== _id));
                alert('Contact deleted successfully!');
            } catch (error) {
                console.error('Error deleting contact:', error.message);
            }
        }
    };

    const handleEdit = (_id) => {
        const contactToEdit = contacts.find(contact => contact._id === _id);
        setEditContact(contactToEdit);
        setIsEditModalOpen(true);
    };

    const handleUpdateContact = async () => {
        if (editContact.replyNote && editContact.status) {
            try {
                const response = await axios.put(`${API_URL}/${editContact._id}`, editContact);
                if (response.status === 200) {
                    setContacts(contacts.map(contact =>
                        contact._id === editContact._id ? response.data : contact
                    ));
                    setEditContact(null);
                    setIsEditModalOpen(false);
                    alert('Contact updated successfully!');
                }
            } catch (error) {
                console.error('Error updating contact:', error.message);
            }
        } else {
            alert('Please fill out all fields.');
        }
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditContact({ ...editContact, [name]: value });
    };

    return (
        <div className="table-container">
            <h1>Reservations</h1>

            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Function Date</th>
                        <th>Event</th>
                        <th>Special Note</th>
                        <th>Phone</th>
                        <th>Reply Note</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {contacts.map((contact) => (
                        <tr key={contact._id}>
                            <td>{contact.name}</td>
                            <td>{contact.email}</td>
                            <td>{contact.functionDate}</td>
                            <td>{contact.event}</td>
                            <td>{contact.specialNote}</td>
                            <td>{contact.phone}</td>
                            <td>{contact.replyNote}</td>
                            <td>{contact.status}</td>
                            <td>
                                <button onClick={() => handleEdit(contact._id)} className="btn-edit-item">Edit</button>
                                <button onClick={() => handleDelete(contact._id)} className="btn-delete-item">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Edit Contact Modal */}
            {editContact && (
                <Modal
                    isOpen={isEditModalOpen}
                    onRequestClose={() => setIsEditModalOpen(false)}
                    contentLabel="Edit Contact"
                    className="Modal"
                    overlayClassName="Overlay"
                >
                    <h2>Edit Contact</h2>
                    <textarea
                        name="replyNote"
                        placeholder="Reply Note"
                        value={editContact.replyNote || ""}
                        onChange={handleEditInputChange}
                    />
                    <select
                        name="status"
                        value={editContact.status || "Pending"}
                        onChange={handleEditInputChange}
                    >
                        <option value="Pending">Pending</option>
                        <option value="done">Done</option>
                    </select>
                    <button className="btn-edit-item" onClick={handleUpdateContact}>Update Query</button>
                    <button className="btn-delete-item" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                </Modal>
            )}
        </div>
    );
};

export default ContactList;
