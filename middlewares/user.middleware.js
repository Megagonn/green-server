const {validationFails} = require("../utilities/requestVal");
const {userHeaderSchema} = require("../utilities/schemas");

const userMiddleware = (req, res, next) => {
	const {value: {userid}, error} = userHeaderSchema.validate(req.headers);
	if (error) return validationFails(res, error);
	req.user = {userId: userid}
	next();
}

module.exports = {userMiddleware}