import { faker } from "@faker-js/faker";
import Job, { EXPERIENCE_LEVELS, JOB_TYPES } from "../models/job.model.js";

const CATEGORIES = [
  "Engineering",
  "Design",
  "Marketing",
  "Sales",
  "Finance",
  "Support",
  "Operations",
  "Data",
];

const BENEFITS = [
  "Health insurance",
  "Remote friendly",
  "Paid time off",
  "Learning budget",
  "Flexible hours",
  "Annual bonus",
  "Gym membership",
];

export const buildMockJob = (createdBy) => {
  const min = faker.number.int({ min: 30, max: 90 }) * 1000;
  const deadline = faker.date.soon({ days: 60 });

  return {
    title: faker.person.jobTitle().slice(0, 100),
    company: faker.company.name().slice(0, 100),
    description: faker.lorem.paragraphs(3),
    requirements: faker.helpers.multiple(() => faker.lorem.sentence(), { count: 4 }),
    location: `${faker.location.city()}, ${faker.location.country()}`.slice(0, 100),
    jobType: faker.helpers.arrayElement(JOB_TYPES),
    experienceLevel: faker.helpers.arrayElement(EXPERIENCE_LEVELS),
    salaryRange: {
      min,
      max: min + faker.number.int({ min: 10, max: 60 }) * 1000,
      currency: "USD",
    },
    skills: faker.helpers.uniqueArray(() => faker.hacker.noun(), 5),
    benefits: faker.helpers.arrayElements(BENEFITS, { min: 2, max: 4 }),
    applicationUrl: faker.internet.url(),
    isRemote: faker.datatype.boolean(),
    category: faker.helpers.arrayElement(CATEGORIES),
    openings: faker.number.int({ min: 1, max: 5 }),
    status: "open",
    deadline,
    createdBy,
  };
};

export const buildMockJobs = (count, createdBy) =>
  Array.from({ length: count }, () => buildMockJob(createdBy));

export const generateMockJobs = async (count = 10, employerId) => {
  const jobs = await Job.insertMany(buildMockJobs(count, employerId));
  console.log(`[seed] Successfully created ${jobs.length} mock jobs!`);
  return jobs;
};