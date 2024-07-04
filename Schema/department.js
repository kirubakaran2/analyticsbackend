const mongoose = require("mongoose");

const Schema = {
    college: {type: Object},
    department: {type: Object},
    year: {type: Number},
    semester: {type: Number},
    section: {type:String},
}

const Department = new mongoose.model("departments",Schema);

module.exports = Department;
