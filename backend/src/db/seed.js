require('dotenv').config();
const pool = require('./pool');
const migrate = require('./migrate');

const candidates = [
  ['Aarav Sharma', 'aarav.sharma@gmail.com', '9876543210', '1996-04-12', 'Male', 'Bengaluru', 'B.Tech Computer Science', 4, 'Frontend Developer', ['React', 'TypeScript', 'Tailwind'], 1400000, 'Interviewing'],
  ['Priya Verma', 'priya.verma@outlook.com', '9812345678', '1998-09-03', 'Female', 'Pune', 'MCA', 2.5, 'Backend Developer', ['Node.js', 'PostgreSQL', 'Docker'], 1100000, 'Shortlisted'],
  ['Rohan Mehta', 'rohan.mehta@yahoo.com', '9988776655', '1993-01-25', 'Male', 'Mumbai', 'B.E. Information Technology', 7, 'Tech Lead', ['Java', 'Spring Boot', 'AWS', 'Kubernetes'], 2800000, 'Selected'],
  ['Sneha Iyer', 'sneha.iyer@gmail.com', '9123456780', '2000-06-18', 'Female', 'Chennai', 'B.Sc Statistics', 1, 'Data Analyst', ['Python', 'SQL', 'Power BI'], 700000, 'Applied'],
  ['Karan Singh', 'karan.singh@gmail.com', '9765432109', '1995-11-07', 'Male', 'Delhi', 'B.Tech Electronics', 5, 'DevOps Engineer', ['AWS', 'Terraform', 'CI/CD'], 1800000, 'Applied'],
  ['Ananya Gupta', 'ananya.gupta@gmail.com', '9001122334', '1999-02-14', 'Female', 'Hyderabad', 'B.Des', 3, 'UI/UX Designer', ['Figma', 'Prototyping', 'User Research'], 1000000, 'Interviewing'],
  ['Vikram Rao', 'vikram.rao@gmail.com', '9345678901', '1991-08-30', 'Male', 'Bengaluru', 'M.Tech Computer Science', 9, 'Engineering Manager', ['Leadership', 'System Design', 'Go'], 3600000, 'Shortlisted'],
  ['Meera Nair', 'meera.nair@gmail.com', '9456123780', '1997-12-22', 'Female', 'Kochi', 'BCA', 3, 'QA Engineer', ['Selenium', 'Cypress', 'Jest'], 850000, 'Rejected'],
  ['Arjun Patel', 'arjun.patel@gmail.com', '9567812340', '1998-05-09', 'Male', 'Ahmedabad', 'B.Tech Computer Science', 2, 'Full Stack Developer', ['React', 'Node.js', 'MongoDB'], 1000000, 'Applied'],
  ['Ishita Banerjee', 'ishita.b@gmail.com', '9678123450', '2001-03-27', 'Female', 'Kolkata', 'B.Tech Computer Science', 0, 'Software Engineer Intern', ['C++', 'DSA', 'Python'], 400000, 'Applied'],
  ['Nikhil Joshi', 'nikhil.joshi@gmail.com', '9789012345', '1994-07-15', 'Male', 'Jaipur', 'MBA HR', 6, 'HR Business Partner', ['Recruitment', 'Payroll', 'HRMS'], 1300000, 'Interviewing'],
  ['Tanvi Kulkarni', 'tanvi.k@gmail.com', '9890123456', '1999-10-01', 'Female', 'Nagpur', 'M.Sc Data Science', 1.5, 'ML Engineer', ['Python', 'PyTorch', 'MLOps'], 1200000, 'Shortlisted'],
];

async function seed() {
  await migrate();
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM candidates');
  if (rows[0].n > 0 && !process.argv.includes('--force')) {
    console.log(`Skipped: table already has ${rows[0].n} rows (use --force to add anyway)`);
    return;
  }
  for (const c of candidates) {
    await pool.query(
      `INSERT INTO candidates
        (full_name, email, phone, date_of_birth, gender, city, qualification,
         experience_years, position_applied, skills, expected_salary, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT DO NOTHING`,
      c
    );
  }
  console.log(`Seeded ${candidates.length} candidates`);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
