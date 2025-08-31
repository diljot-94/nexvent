module.exports = (sequelize, DataTypes) => {
  const TicketType = sequelize.define('TicketType', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.INTEGER,  // Changed to INTEGER to represent price in rupees
      allowNull: false,
    },
    saleStartDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    saleEndDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    maxQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  return TicketType;
};
