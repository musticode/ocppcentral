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
  return await User.find();
};

export const updateUser = async (id, userData) => {
  return await User.findByIdAndUpdate(id, userData);
};
