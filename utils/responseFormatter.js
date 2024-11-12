const formatSuccessResponse = (data, message) => {
  // Function to transform data by removing unwanted fields
  const transformData = (inputData) => {
    if (Array.isArray(inputData)) {
      return inputData.map((item) => {
        // Remove unwanted fields like $__ and internal Mongoose properties
        const { $__ , ...rest } = item.toObject ? item.toObject() : item; // If it's a Mongoose document, call toObject() to remove Mongoose internal properties
        return rest;
      });
    } else if (inputData && typeof inputData === 'object') {
      // For single object data
      const { $__ , ...rest } = inputData.toObject ? inputData.toObject() : inputData;
      return rest;
    } else {
      return inputData;
    }
  };

  const transformedData = transformData(data);

  return {
    success: true,
    message: message || 'Operation completed successfully',
    data: transformedData,
  };
};


const formatErrorResponse = (message, data = null) => {
  return {
    success: false,
    message: message || 'An error occurred',
    data,
  };
};

module.exports = {
  formatSuccessResponse,
  formatErrorResponse,
};
