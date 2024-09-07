const express = require('express');
const router = express.Router();
const User = require('../Schema/user');

// Handler function for the route
exports.batch = async (req, res) => {
    try {
        const { collegeid, batch } = req.params;

        const users = await User.find({
            college: collegeid,
            batch: batch
        }).select('-password');

        if (users.length === 0) {
            return res.status(404).json({ message: 'No users found for the given college and batch.' });
        }

        return res.json(users);

    } catch (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
};
