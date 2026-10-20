// Task1: initiate app and run server at 3000

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path=require('path');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    salary: { type: Number, required: true, min: 0 }
});

const Employee = mongoose.model('Employee', employeeSchema);

const asyncHandler = (handler) => (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
};

const validEmployeeId = (id, res) => {
    if (!mongoose.isValidObjectId(id)) {
        res.status(400).json({ error: 'Invalid employee id' });
        return false;
    }
    return true;
};

const employeeFields = ({ name, location, position, salary }) => ({
    name,
    location,
    position,
    salary
});

app.use(express.static(path.join(__dirname + '/dist/FrontEnd')));
app.use(express.static(path.join(__dirname, 'dist', 'Frontend')));

// Task 2: create mongoDB connection

//Task 2 : write api with error handling and appropriate api mentioned in the TODO below

app.get('/api/employeelist', asyncHandler(async (req, res) => {
    const employees = await Employee.find().lean();
    res.json(employees);
}));

//TODO: get data from db  using api '/api/employeelist'

app.get('/api/employeelist/:id', asyncHandler(async (req, res) => {
    if (!validEmployeeId(req.params.id, res)) return;

    const employee = await Employee.findById(req.params.id).lean();
    if (!employee) {
        res.status(404).json({ error: 'Employee not found' });
        return;
    }
    res.json(employee);
}));

//TODO: get single data from db  using api '/api/employeelist/:id'

app.post('/api/employeelist', asyncHandler(async (req, res) => {
    const employee = await Employee.create(employeeFields(req.body || {}));
    res.status(201).json(employee);
}));

//TODO: send data from db using api '/api/employeelist'
//Request body format:{name:'',location:'',position:'',salary:''}

app.delete('/api/employeelist/:id', asyncHandler(async (req, res) => {
    if (!validEmployeeId(req.params.id, res)) return;

    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
        res.status(404).json({ error: 'Employee not found' });
        return;
    }
    res.json({ message: 'Employee deleted', employee });
}));

//TODO: delete a employee data from db by using api '/api/employeelist/:id'

app.put('/api/employeelist', asyncHandler(async (req, res) => {
    const id = req.body && (req.body._id || req.body.id);
    if (!validEmployeeId(id, res)) return;

    const employee = await Employee.findByIdAndUpdate(
        id,
        employeeFields(req.body),
        { new: true, runValidators: true }
    );
    if (!employee) {
        res.status(404).json({ error: 'Employee not found' });
        return;
    }
    res.json(employee);
}));

//TODO: Update  a employee data from db by using api '/api/employeelist'
//Request body format:{name:'',location:'',position:'',salary:''}

app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

app.use((err, req, res, next) => {
    if (err instanceof mongoose.Error.ValidationError || err instanceof mongoose.Error.CastError) {
        res.status(400).json({ error: err.message });
        return;
    }
    if (err && err.code === 11000) {
        res.status(409).json({ error: 'An employee with these details already exists' });
        return;
    }
    if (err instanceof SyntaxError && err.status === 400 && Object.prototype.hasOwnProperty.call(err, 'body')) {
        res.status(400).json({ error: 'Invalid JSON request body' });
        return;
    }

    console.error('Request failed:', err);
    res.status(500).json({ error: 'Internal server error' });
});

//! dont delete this code. it connects the front end file.
app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname + '/dist/Frontend/index.html'));
});

async function start() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error('MONGODB_URI is required. Set it to your MongoDB Atlas connection string.');
    }

    await mongoose.connect(mongoUri);
    app.listen(port, () => {
        console.log(`Employee app server listening on port ${port}`);
    });
}

if (require.main === module) {
    start().catch((err) => {
        console.error('Failed to start Employee app:', err);
        process.exitCode = 1;
    });
}

module.exports = app;
