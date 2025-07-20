import * as yup from "yup";

export const AddAndEditPropertySchema = yup.object({
  propertyName: yup.string().required(),
  tenantType: yup.string().required(),
  mealType: yup.string().required(),
  doorNo: yup.string().required(),
  streetName: yup.string().required(),
  area: yup.string().required(),
  landmark: yup.string().nullable(), // only nullable, no need for .optional()
  state: yup.string().required(),
  city: yup.string().required(),
  pincode: yup
    .string()
    .required()
    .matches(/^[1-9][0-9]{5}$/),
  noticePeriod: yup.string().required(),
  facilities: yup.array().of(yup.string().required()).optional(), // array optional
  images: yup.array().of(yup.string().required()).optional(), // array optional
});

export type PropertyFormFields = yup.InferType<typeof AddAndEditPropertySchema>;
