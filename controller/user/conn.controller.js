const {Op} = require("sequelize");
const db = require("../../models");
const {validationFails} = require("../../utilities/requestVal");
const schemas = require("../../utilities/schemas");

const newConnection = async (req, res) => {
	const {value: {toId}, error} = schemas.toId.validate(req.query);
	if (error) return validationFails(res, error);
	const {userId} = req.user; // set in user.middleware

	if (toId == userId) {
		return res.status(422).json({
			message: "Users cannot send connection to themselves",
			success: false,
		})
	}

	try {
		// check if connection request exist
		const existingConn = await db.UserConnection.findOne({
			where: {
				[Op.or]: [
					{fromId: userId, toId},
					{fromId: toId, toId: userId}
				]
			}
		})


		if (existingConn) {
			// if existing connection was rejected, update connection details
			if (existingConn.status == 2) {
				existingConn.set({fromId: userId, toId, status: 0});
				return await existingConn.save().then(connection => {
					return res.status(200).json({
						message: "Connection request successful",
						success: true,
						data: connection
					})
				}).catch(err => {
					return res.status(500).json({
						message: "An error occured when creating connecting request, make sure to provide a valid user id",
						success: false,
					})
				})
			}

			return res.status(400).json({
				message: "Connection request exist before",
				success: false,
				data: existingConn
			})
		}

		db.UserConnection.create({fromId: userId, toId}).then(connection => {
			return res.status(200).json({
				message: "Connection request successful",
				success: true,
				data: connection
			})
		}).catch(err => {
			//console.log(err)
			return res.status(500).json({
				message: "An error occured when creating connecting request, make sure to provide a valid user id",
				success: false,
			})
		})

	} catch (error) {
		return res.status(500).json({
			message: "An error occured when confirming initial connection",
			success: false
		});
	}

}

const acceptConnection = async (req, res) => {
	const {value: {fromId}, error} = schemas.fromId.validate(req.query);
	if (error) return validationFails(res, error);
	const {userId} = req.user;
	console.log(userId)
	try {
		await db.UserConnection.update({status: 1}, {where: {fromId, toId: userId}})
		return res.status(200).json({
			message: "Connection accepted",
			success: true,
		})
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			message: "An error occured when accpting connection request",
			success: false
		});
	}
}

const rejectConnection = async (req, res) => {
	const {value: {fromId}, error} = schemas.fromId.validate(req.query);
	if (error) return validationFails(res, error);
	const {userId} = req.user;
	try {
		await db.UserConnection.update({status: 2}, {where: {fromId, toId: userId}})
		return res.status(200).json({
			message: "Connection rejected",
			success: true,
		})
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			message: "An error occured when rejecting connection request",
			success: false
		});
	}
}

const getMyConnectionRequests = async (req, res) => {
	const {userId} = req.user;
	try {
		const requests = await db.UserConnection.findAll({
			where: {
				toId: userId,
				status: 0,
			},
			include: ['from']
		});
		return res.status(200).json({
			message: "Successful",
			success: true,
			data: requests
		})
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			message: "An error occured when getting pending request",
			success: false
		});
	}
}

const getMySentConnectionRequests = async (req, res) => {
	const {userId} = req.user;
	try {
		const requests = await db.UserConnection.findAll({
			where: {
				fromId: userId,
				status: {
					[Op.ne]: 1
				}
			},
			include: ['to']
		});
		return res.status(200).json({
			message: "Successful",
			success: true,
			data: requests
		})
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			message: "An error occured when getting sent request",
			success: false
		});
	}
}

const myConnections = async (req, res) => {
	const {userId} = req.user;
	try {
		const requests = await db.UserConnection.findAll({
			where: {
				[Op.or]: [
					{fromId: userId},
					{toId: userId}
				],
				status: 1
			},
			include: ['from', 'to']
		});
		return res.status(200).json({
			message: "Successful",
			success: true,
			data: requests
		})
	} catch (error) {
		return res.status(500).json({
			message: "An error occured when getting connected users",
			success: false
		});
	}
}

const processContacts = async (req, res) => {
	const {value: {contacts}, error} = schemas.processContactsSchema.validate(req.body);
	if (error) return validationFails(res, error);

	try {
		checkedContacts = await Promise.all(
			contacts.map(async _contact => {
				let userFound = await db.User.findOne({where: {phone: _contact.phone}});
				if (userFound) {
					return {..._contact, greenId: userFound.id, nToken: userFound.nToken}
				} else {
					return {..._contact, greenId: 0}
				}
			})
		)

		return res.status(200).json({
			message: "Done",
			success: true,
			data: checkedContacts
		})
	} catch (error) {
		return res.status(500).json({
			message: "Can't process Contacts",
			success: false,
		})
	}
}

module.exports = {newConnection, acceptConnection, getMyConnectionRequests, myConnections, getMySentConnectionRequests, rejectConnection, processContacts}