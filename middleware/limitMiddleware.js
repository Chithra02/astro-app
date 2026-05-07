const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const today = new Date().toDateString();

    if (user.lastUsedDate !== today) {
      user.dailyUsage = 0;
      user.lastUsedDate = today;
    }

    if (!user.isPremium && user.dailyUsage >= 5) {
      return res.status(403).json({ msg: "Daily limit reached" });
    }

    user.dailyUsage += 1;
    await user.save();

    next();

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Limit middleware error" });
  }
};