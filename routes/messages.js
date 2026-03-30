var express = require('express');
var router = express.Router();
let mongoose = require('mongoose');
let messageModel = require('../schemas/messages');
let { checkLogin } = require('../utils/authHandler.js');

router.get('/', checkLogin, async function (req, res, next) {
    try {
        let userId = req.userId;
        let messages = await messageModel.find({
            $or: [
                { from: userId },
                { to: userId }
            ]
        }).sort({ createdAt: -1 });

        let mapLastMessage = new Map();

        for (const message of messages) {
            let partnerId = message.from.toString() === userId
                ? message.to.toString()
                : message.from.toString();

            if (!mapLastMessage.has(partnerId)) {
                mapLastMessage.set(partnerId, message);
            }
        }

        res.send(Array.from(mapLastMessage.values()));
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

router.get('/:userID', checkLogin, async function (req, res, next) {
    try {
        let currentUserId = new mongoose.Types.ObjectId(req.userId);
        let otherUserId = new mongoose.Types.ObjectId(req.params.userID);

        let messages = await messageModel.find({
            $or: [
                {
                    from: currentUserId,
                    to: otherUserId
                },
                {
                    from: otherUserId,
                    to: currentUserId
                }
            ]
        }).sort({ createdAt: 1 });

        res.send(messages);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

router.post('/', checkLogin, async function (req, res, next) {
    try {
        let { to, messageContent } = req.body;

        if (!to || !messageContent || !messageContent.type || !messageContent.text) {
            res.status(400).send({ message: 'thieu du lieu' });
            return;
        }

        if (!['file', 'text'].includes(messageContent.type)) {
            res.status(400).send({ message: 'type khong hop le' });
            return;
        }

        let newMessage = new messageModel({
            from: req.userId,
            to: to,
            messageContent: {
                type: messageContent.type,
                text: messageContent.text
            }
        });

        let result = await newMessage.save();
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
