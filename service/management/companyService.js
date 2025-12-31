import Company from "../../model/management/Company.js";

export class CompanyService {
  constructor() {
    this.company = Company;
  }

  async getCompanyByName(name) {
    const company = await this.company.findOne({ name: name });
    if (!company) {
      throw new Error(`Company ${name} not found`);
    }
    return company;
  }

  async getAllCompanies() {
    return await this.company.find();
  }

  async getCompanyById(id) {
    return await this.company.findById(id);
  }

  async createCompany(companyData) {
    if (await this.company.exists({ name: companyData.name })) {
      throw new Error(`Company ${companyData.name} already exists`);
    }
    const company = new Company({
      id: companyData.id,
      ...companyData,
    });
    await company.save();
    return company;
  }

  async updateCompany(id, companyData) {
    return await this.company.findByIdAndUpdate(id, companyData);
  }

  async deleteCompany(id) {
    return await this.company.findByIdAndDelete(id);
  }
}

export default new CompanyService();
