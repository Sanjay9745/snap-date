const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../models/User'); // Assuming you have a User model
const JWT_SECRET = process.env.JWT_SECRET;
const findNearbyUsers  = require('../../helpers/findNearByUser');
const { isNull, isTruthy } = require('../../helpers/validate');
const geolib = require('geolib'); // Import geolib

exports.createOrFind = async (req, res) => {
    const { username, latitude, longitude, age, gender } = req.body;
    try {
        let newUsername = username.replace(/\s+/g, '').toLowerCase();
        let user = await User.findOne({ username: newUsername });
        if (!user) {
           user =  new User({
                username: newUsername,
                age,
                gender,
                location: {
                    type: 'Point',
                    coordinates: [longitude, latitude], // MongoDB expects [longitude, latitude]
                },
            });
            await user.save();
        } else {
            user.location = {
                type: 'Point',
                coordinates: [longitude, latitude], // MongoDB expects [longitude, latitude]
            };
            user.age = age;
            user.gender = gender;
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET);

        res.json({ success: true, token, user: { username: user.username, age: user.age, gender: user.gender, location: user.location } });
    } catch (error) {
        console.error('Error creating or finding user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getUsers = async (req, res) => {
    try {
        let { latitude, longitude, page = 1, limit = 10, minAge, maxAge, gender, maxDistance = 50000, anywhere = false } = req.query;

        let query = {};

        // Age filter
        if (minAge && maxAge) {
            query.age = { $gte: Number(minAge), $lte: Number(maxAge) };
        }

        // Gender filter
        if (gender) {
            query.gender = gender;
        }

        // Handle latitude and longitude
        if (isNull(latitude) || isNull(longitude)) {
            let currentUser = await User.findOne({ _id: req.user.id });
            if (currentUser?.location?.coordinates) {
                latitude = currentUser.location.coordinates[1];
                longitude = currentUser.location.coordinates[0];
            } else {
                // If currentUser's location is not set, default to null
                latitude = null;
                longitude = null;
            }
        }

        // Pagination and distance
        page = Number(page);
        limit = Number(limit);
        maxDistance = Number(maxDistance);
        maxDistance *= 1000; // Convert to meters

        // Location filter
        if (!isTruthy(anywhere) && latitude && longitude) {
            query.location = {
                $geoWithin: {
                    $centerSphere: [
                        [Number(longitude), Number(latitude)], 
                        maxDistance / 6378100 // Convert distance to radians
                    ]
                }
            };
        }

        // Fetch total number of users (for pagination)
        const total = await User.countDocuments(query);

        // Fetch users with pagination
        let users = await User.find(query)
            .limit(limit)
            .skip((page - 1) * limit);

        // Add `away` key to each user
        let newUsers = users.map(user => {
            const userLatitude = user.location.coordinates[1];
            const userLongitude = user.location.coordinates[0];

            let away = null;

            // Calculate distance only if latitude and longitude are valid
            if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(userLatitude) && !isNaN(userLongitude)) {
                // Calculate distance in meters
                const distanceInMeters = geolib.getDistance(
                    { latitude: Number(latitude), longitude: Number(longitude) },
                    { latitude: userLatitude, longitude: userLongitude }
                );

                away = geolib.convertDistance(distanceInMeters, 'km');
                away = away.toFixed(2); // Round to 2 decimal places
            }

            return {
                ...user.toObject(), // Convert Mongoose document to plain object
                away, // Add `away` key
            };
        });

        // Send response with pagination details
        res.status(200).json({
            success: true,
            users: newUsers,
            page,
            perPage: limit,
            total,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


exports.getUser = async (req, res) => {
    const userId = req.user.id;
    try {
        let user = await User.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, user: { username: user.username, age: user.age, gender: user.gender, location: user.location, bio:user.bio } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

exports.updateLocation = async (req, res) => {
    const { username, latitude, longitude } = req.body;
    try {
        let user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.location = {
            type: 'Point',
            coordinates: [longitude, latitude], // MongoDB expects [longitude, latitude]
        };
        await user.save();

        res.status(200).json({ success: true, message: 'Location updated successfully', user: { username: user.username, location: user.location } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateUser =  async (req, res) => {
    const userId = req.user.id;
    const { age, gender, bio } = req.body;
    try {
        let user = await User.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (age) user.age = age;
        if (gender) user.gender = gender;
        if (bio) user.bio = bio;

        await user.save();

        res.status(200).json({ success: true, message: 'User updated successfully', user: { username: user.username, age: user.age, gender: user.gender, bio: user.bio, location: user.location } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.protected = async (req, res) => {
    res.json({ success: true, message: 'You are authorized' });
};

exports.deleteUser = async (req, res) => {
    const userId = req.user.id;
    try {
        let user = await User.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await User.deleteOne({ _id: userId });

        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}