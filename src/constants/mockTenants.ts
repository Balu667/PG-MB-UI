export interface Tenant {
  id: string;
  name: string;
  phone: string;
  room: string;
  rent: number;
  status: "Active" | "Dues" | "Under Notice";
  sharing: number;
  dues: number;
  joinedOn: string;
  downloadedApp: boolean;
  noticePeriod: number;
  bedNo: string;
  securityDeposit: number;
  altPhone?: string;
  email?: string;
  gender?: "Male" | "Female";
  mealType?: string;
  bloodGroup?: string;
  officeCollegeName?: string;
  officeCollegeAddress?: string;
  permanentAddress?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  guardianName?: string;
  guardianContact?: string;
  guardianRelation?: string;
  govtIdProof?: string;
  rentalAgreement?: string;
  imageUri?: string;
}

export const mockTenants: Tenant[] = Array.from({ length: 15 }).map((_, i) => ({
  id: `tenant_${i + 1}`,
  name: `Tenant ${i + 1}`,
  phone: `98765432${10 + i}`,
  altPhone: `91234567${10 + i}`,
  email: `tenant${i + 1}@example.com`,
  gender: i % 2 === 0 ? "Male" : "Female",
  mealType: "Veg",
  bloodGroup: "B+",
  officeCollegeName: "XYZ College",
  officeCollegeAddress: "123 Street, City",
  permanentAddress: "Permanent Address here",
  vehicleType: "Two-Wheeler",
  vehicleNumber: `XX${1000 + i}`,
  guardianName: `Guardian ${i + 1}`,
  guardianContact: `90000000${10 + i}`,
  guardianRelation: "Father",
  govtIdProof: "",
  rentalAgreement: "",
  room: `10${i % 5}`,
  bedNo: `A`,
  rent: 5000 + i * 200,
  status: i % 3 === 0 ? "Active" : i % 3 === 1 ? "Dues" : "Under Notice",
  sharing: (i % 5) + 1,
  dues: i % 3 === 1 ? 15000 : 0,
  joinedOn: `2024-0${(i % 9) + 1}-0${(i % 9) + 1}`,
  downloadedApp: i % 2 === 0,
  noticePeriod: 30,
  securityDeposit: 2000,
  imageUri: "https://randomuser.me/api/portraits/men/" + (10 + i) + ".jpg",
}));
