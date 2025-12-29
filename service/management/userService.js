import User from "../../model/management/User.js";

export const createUser = async (userData) => {
  const user = new User(userData);
  await user.save();
  return user;
};

export const getUserById = async (id) => {
  return await User.findById(id);
};

export const getAllUsers = async () => {
  console.log("getAllUsers");
  return await User.find().sort({ createdAt: -1 });
};

export const getUserByEmail = async (email) => {
  return await User.findOne({ email });
};

export const updateUser = async (id, userData) => {
  return await User.findByIdAndUpdate(id, userData);
};
