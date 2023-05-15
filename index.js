const express = require('express');
const app = express();
const port = 3001;

const mongojs = require('mongojs')
const db = mongojs('mongodb://127.0.0.1:27017/Chat', ['Users', 'Chats'])

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');

    /*
    let message1 = {sender: 'a', msg: 'Hello World!', time: '12:00'};
    let message2 = {sender: 'ander', msg: 'Hello World!', time: '12:01'};
    db.Chats.insert({users: ['a', 'ander'], messages: [message1, message2]})
    */
});

app.get('/api/users', (req, res) => {
    db.Users.find({}, (err, docs) => {
        if (err) {
            console.log(err)
            res.json({ message: 'Error' })
        } else if (docs.length > 0) {
            res.json({ message: 'ok', users: docs })
        } else {
            res.json({ message: 'No users' })
        }
    })
});

app.get('/api/friends/:username', (req, res) => {
    db.Users.find({username: req.params.username}, (err, docs) => {
        if (err) {
            console.log(err)
            res.json({ message: 'Error' })
        } else if (docs.length > 0) {
            if (docs[0].friends.length > 0) {
                res.json({ message: 'ok', friends: docs[0].friends})
            }
        } else {
            res.json({ message: 'No friends' })
        }
    })
});

app.post('/api/addFriend/', (req, res) => {
    const { username, friend } = req.body;
    db.Users.find({username: username}, (err, docs) => {
        if (err) {
            console.log(err)
            res.status(401).json({ message: 'Error1' });
        } else {
            if (docs.length > 0) {
                if (docs[0].friends.includes(friend)) {
                    res.status(401).json({ message: 'Friend already exists' });
                } else {
                    db.Users.update({username: username}, {$push: {friends: friend}}, (err, docs) => {
                        if (err) {
                            console.log(err)
                            res.status(401).json({ message: 'Add friend failed' });
                        } else {
                            db.Users.find({username: friend}, (err, docs) => {
                                if (err) {
                                    console.log(err)
                                    res.status(401).json({ message: 'Error2' });
                                } else {
                                    if (docs.length > 0) {
                                        db.Users.update({username: friend}, {$push: {friends: username}}, (err, docs) => {
                                            if (err) {
                                                console.log(err)
                                                res.status(401).json({ message: 'Add friend failed' });
                                            } else {
                                                res.status(200).json({ message: 'ok' });
                                            }
                                        })
                                    } else {
                                        res.status(401).json({ message: 'Error3' });
                                    }
                                }
                            })
                        }
                    })
                }
            } else {
                res.status(401).json({ message: 'Error4' });
            }
        }
    })
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.Users.find({username: username, password: password}, (err, docs) => {
        if (err) {
            console.log(err)
            res.status(401).json({ message: 'Login failed' });
        } else {
            if (docs.length > 0) {
                res.status(200).json({ message: 'ok' });
            } else {
                res.status(401).json({ message: 'Login failed' });
            }
        }
    })
});

app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    // Check the username and password against a database or other authentication mechanism
    db.Users.find({username: username}, (err, docs) => {
        if (err) {
            console.log(err)
            res.status(401).json({ message: 'Registration failed' });
        } else {
            if (docs.length > 0) {
                res.status(401).json({ message: 'Username already exists' });
            } else {
                db.Users.insert({username: username, email: email, password: password, friends: ['kimi']}, (err, docs) => {
                    if (err) {
                        console.log(err)
                        res.status(401).json({ message: 'Registration failed' });
                    } else {
                        res.status(200).json({ message: 'ok' });
                    }
                })
            }
        }
    })
});

app.get('/api/messages/:username/:friend', (req, res) => {
    db.Chats.find({users: [req.params.username, req.params.friend]}, (err, docs) => {
        if (err) {
            console.log(err)
            res.json({ message: 'Error' })
        } else if (docs.length > 0) {
            if (docs[0].messages.length > 0) {
                res.json({ message: 'ok', messages: docs[0].messages})
            } else {
                res.json({ message: 'No messages' })
            }
        } else {
            //res.json({ message: 'No chat' })
            db.Chats.find({users: [req.params.friend, req.params.username]}, (err, docs) => {
                if (err) {
                    console.log(err)
                    res.json({ message: 'Error' })
                } else if (docs.length > 0) {
                    if (docs[0].messages.length > 0) {
                        res.json({ message: 'ok', messages: docs[0].messages})
                    } else {
                        res.json({ message: 'No messages' })
                    }
                } else {
                    db.Chats.insert({users: [req.params.username, req.params.friend], messages: []}, (err, docs) => {
                        if (err) {
                            console.log(err)
                            res.json({ message: 'Error' })
                        } else {
                            res.json({ message: 'No messages' })
                        }
                    })
                }
            })

        }
    })
});

app.post('/api/newMessage', (req, res) => {
    const { username, friend, message } = req.body;
    db.Chats.update({users: [username, friend]}, {$push: {messages: message}}, (err, docs) => {
            if (err) {
                db.Chats.update({users: [friend, username]}, {$push: {messages: message}}, (err, docs) => {
                    if (err) {
                        console.log(err)
                        res.json({ message: 'Error' })
                    } else {
                        res.json({ message: 'ok' })
                    }
                })
            } else {
                res.json({ message: 'ok' })
            }
        })
});



app.listen(port, () => {
  console.log(`Server app listening at http://localhost:${port}`);
});