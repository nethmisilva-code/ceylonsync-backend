import Employee from "../models/Employee.js";

const createEmployee = async (req, res) => {
  try {
    const {
      employeeCode,
      firstName,
      lastName,
      email,
      phone,
      nic,
      address,
      department,
      designation,
      joinedDate,
      basicSalary,
      allowance,
      epfNumber,
      bankName,
      bankAccountNumber,
      linkedUser,
    } = req.body;

    if (
      !employeeCode ||
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !nic ||
      !department ||
      !designation ||
      !joinedDate ||
      basicSalary === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    const existingEmployeeCode = await Employee.findOne({
      employeeCode: employeeCode.toUpperCase(),
    });

    if (existingEmployeeCode) {
      return res.status(400).json({
        success: false,
        message: "Employee code already exists",
      });
    }

    const existingNIC = await Employee.findOne({ nic });

    if (existingNIC) {
      return res.status(400).json({
        success: false,
        message: "NIC already exists",
      });
    }

    const employee = await Employee.create({
      employeeCode: employeeCode.toUpperCase(),
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      nic,
      address,
      department,
      designation,
      joinedDate,
      basicSalary,
      allowance: allowance ?? 0,
      epfNumber,
      bankName,
      bankAccountNumber,
      linkedUser: linkedUser ?? null,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employee,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllEmployees = async (req, res) => {
  try {
    const { department, employmentStatus, isActive, search } = req.query;

    const filter = {};

    if (department) {
      filter.department = department;
    }

    if (employmentStatus) {
      filter.employmentStatus = employmentStatus;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { employeeCode: { $regex: search, $options: "i" } },
        { designation: { $regex: search, $options: "i" } },
        { nic: { $regex: search, $options: "i" } },
      ];
    }

    const employees = await Employee.find(filter)
      .populate("linkedUser", "firstName lastName email username role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Employees fetched successfully",
      data: employees,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate(
      "linkedUser",
      "firstName lastName email username role"
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee fetched successfully",
      data: employee,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      department,
      designation,
      joinedDate,
      basicSalary,
      allowance,
      epfNumber,
      bankName,
      bankAccountNumber,
      employmentStatus,
      isActive,
      linkedUser,
    } = req.body;

    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    employee.firstName = firstName ?? employee.firstName;
    employee.lastName = lastName ?? employee.lastName;
    employee.email = email ? email.toLowerCase() : employee.email;
    employee.phone = phone ?? employee.phone;
    employee.address = address ?? employee.address;
    employee.department = department ?? employee.department;
    employee.designation = designation ?? employee.designation;
    employee.joinedDate = joinedDate ?? employee.joinedDate;
    employee.basicSalary = basicSalary ?? employee.basicSalary;
    employee.allowance = allowance ?? employee.allowance;
    employee.epfNumber = epfNumber ?? employee.epfNumber;
    employee.bankName = bankName ?? employee.bankName;
    employee.bankAccountNumber = bankAccountNumber ?? employee.bankAccountNumber;
    employee.linkedUser = linkedUser ?? employee.linkedUser;

    if (employmentStatus) {
      employee.employmentStatus = employmentStatus;
    }

    if (typeof isActive === "boolean") {
      employee.isActive = isActive;
    }

    employee.updatedBy = req.user._id;

    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: employee,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deactivateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    employee.isActive = false;
    employee.employmentStatus = "inactive";
    employee.updatedBy = req.user._id;

    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Employee deactivated successfully",
      data: employee,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deactivateEmployee,
};