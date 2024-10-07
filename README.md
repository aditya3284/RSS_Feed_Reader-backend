# Feed Reader : A RSS Reader for YouTube Channels

A backend using **Node.js**, **Express.js**, and **MongoDB**, with support for various features like authentication, file uploads, and data validation.

## Table of Contents

- [Description](#description)
- [Prerequisites](#prerequisites)
- [Technologies Used](#technologies-used)
- [Features](#features)
- [Installation and Setup](#installation-and-setup)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Contributing](#contributing)
- [Acknowledgments](#acknowledgments)
- [Things I learned](#things-i-learned)
- [Future Scope](#future-scope)
- [Contact](#contact)

## Description

This project is a RESTful API built with Node.js as runtime and MongoDB for database. It provides a backend service for managing user accounts and media files. Key features include user authentication, file upload handling, and data validation.

[**Feed Reader Frontend GitHub Repoistory**](https://github.com/username/repositoryName)

- **Technology Stack**: MongoDB, Express.js, Node.js
- **Key Dependencies**: Cloudinary, Bcrypt, Joi, Multer, JSON Web Token (JWT), Cross-Origin Resource Sharing (CORS), XML2JS
- **Development Tools**: ESLint, Prettier, Nodemon
- **API Testing**: Thunder Client

## Prerequisites

1. Node and npm are required. Here are the versions that I have used.

    ```bash
    node --version

    v22.1.0
    ```

    ```bash
    npm --version

    10.7.0
    ```

2. Git is required. Here's the version that I have used

    ```bash
    git --version

    git version 2.45.0.windows.1
    ```

3. At last, a GitHub account. :octocat:


## Technologies Used

- **Node.js:** JavaScript runtime for building scalable network applications.
- **Express.js:** Web application framework for Node.js.
- **MongoDB:** NoSQL database for storing data.
- **Mongoose:** ODM (Object Data Modeling) library for MongoDB and Node.js.
- **Cloudinary:** Cloud-based service for media management and storage.
- **Bcrypt:** Library for hashing passwords.
- **Joi:** Data validation library.
- **Multer:** Middleware for handling file uploads.
- **Jsonwebtoken:** Library for creating and verifying JSON Web Tokens.
- **CORS:** Middleware for enabling Cross-Origin Resource Sharing.
- **XML2JS:** Library for parsing XML data.
- **Nodemon:** Utility for automatically restarting the application during development.
- **ESLint & Prettier:** Tools for code quality and formatting.

## Features

- **RSS Feed Aggregation:** Fetches and displays video posts from selected YouTube channels using their RSS feeds, bypassing the need for YouTube's official API and recommendation algorithms.

- **Comprehensive Post Feed:** Presents a unified feed of all videos from subscribed channels, providing users with a streamlined view of their content without additional YouTube recommendations.

- **View History Management:** Tracks and displays a history of viewed posts, enabling users to revisit content they have previously watched.

- **Recent and Liked Posts:** Features sections for recently viewed videos and liked content, allowing for easy access to favorite and recently watched videos.

- **Channel Library:** Offers a consolidated library where users can browse all subscribed channels and their posts in one place, making it easier to discover content.

- **Robust Authentication:** Ensures user data and interactions are protected with secure authentication.

- **Customizable User Experience:** Allows users to personalize their profiles with profile pictures and manage their profile details effectively.

## Installation and Setup

To set up this project locally, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/your-repository.git

    cd your-repository
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Create a `.env` file:**

    Duplicate the `.env.example` file and rename it to `.env`. Fill in the required environment variables, such as MongoDB connection strings and Cloudinary credentials.

    ```
    MONGO_URI=mongodb_connection_string_without_db_name
    JWT_SECRET=your_jwt_secret
    PORT=your_desired_port
    ```

## Running the Project

- **Start Server:** Use `npm run dev` for development mode with automatic restarts.

  ```bash
  npm run dev
  ```

  The server will start on `http://localhost:3737`. If the `PORT` environment variable in `.env` file is `3737`.

- **Run Linting:** Use `npm run lint` to check code quality.

  ```bash
  npm run lint
  ```

- **Format Code:** Use `npm run format` to format the code according to project standards.

  ```bash
  npm run format
  ```

## Project Structure

Here is a brief overview of the project structure:

```
/.thunder-client            # Thunder client configuration
/public
    /assets                 # Uploaded assets
        .gitkeep            # Commit empty folder
/src
    /controllers            # Controllers for handling requests
    /db                     # Database Configuration
    /middlewares            # Middleware functions
    /models                 # Mongoose models
    /routes                 # API routes
    /utils                  # Utility functions
    app.js                  # Main application file
    constants.js            # Configuration constants
    server.js               # Server entry point
.env                        # Environment variables
.env.sample                 # Sample environment variables
.eslintrc.js                # ESLint configuration
.gitignore                  # Git ignore files
.prettierignore             # Prettier ignore files
.prettierrc                 # Prettier configuration
nodemon.json                # Nodemon configuration
package-lock.json           # Locks dependencies versions
package.json                # Project metadata and dependencies
```

## Testing

API endpoints are tested using Thunder Client. You can import the provided Thunder Client collection and local environment variables from `/.thunder-client` folder for testing the endpoints.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository.
2. Create a new branch `git checkout -b feature/YourFeature`.
3. Make your changes.
4. Commit your changes `git commit -am 'Add new feature'`.
5. Push to the branch `git push origin feature/YourFeature`.
6. Create a new Pull Request.

## Acknowledgments

- [Node.js](https://nodejs.org/)
- [Express.js](http://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Cloudinary](https://cloudinary.com/)
- [Joi](https://joi.dev/)
- [Bcrypt](https://www.npmjs.com/package/bcrypt)
- [Multer](https://www.npmjs.com/package/multer)
- [JSON Web Token](https://jwt.io/)
- [Thunder Client](https://www.thunderclient.com/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [Nodemon](https://nodemon.io/)

## Things I Learned

Being my first backend projec, I gained various useful insight with technologies and techniques used in the project. Here are some of those key learnings:

- **JWT Authentication:**
  - **Description:** Implemented JSON Web Tokens (**JWT**) for user authentication, enabling secure and stateless user sessions.
  - **Impact:** Enhanced application security by ensuring reliable user authentication.

- **Backend Data Validation:**
  - **Description:** Utilized **Joi** for data validation on the backend, ensuring that incoming data meets predefined criteria and maintains data integrity.
  - **Impact:** Improved application reliability by preventing invalid input from frontend being processed.

- **Media Upload Handling:**
  - **Description:** Implemented media upload functionality using **Multer** and **Cloudinary**, allowing users to upload and store image files efficiently.
  - **Impact:** Enabled seamless handling and management of media files, enhancing media management.

- **MongoDB Aggregation Pipelines:**
  - **Description:** Utilized **MongoDB aggregation pipelines** to perform data queries and transformations for desired data organization and retrieval.
  - **Impact:** Optimized data retrieval and processing, leading to efficient queries and desired results.

- **Cross-Origin Resource Sharing (CORS):**
  - **Description:** Configured CORS policies through middleware to handle cross-origin requests, enabling controlled access to resources from frontend.

- **RSS Feed XML Parsing:**
  - **Description:** Implemented XML parsing for RSS feeds using **xml2js**, facilitating the extraction and processing of feed data.
  - **Impact:** Enabled the integration of RSS feed content into the application, providing users with YouTube Channel's post data.

## Future Scope

Looking forward, several enhancements could further improve the functionality and user experience of this project. Here are some of my potential future enhancements ideas:

- **File Import Feature:**
    - **Description:** A feature to allow users to import (JSON or CSV) files from Google Takeout, enabling automatic subscription to channels listed in the file without manual RSS feed entry.
    - **Benefits:** Streamlines the process of subscribing to multiple channels, enhancing user convenience.
- **Channel Search and Subscription:**
    - **Description:** A search functionality for channel names, with the ability to directly subscribe to their feeds.
    - **Benefits:** Improves user experience by simplifying the subscription process for newly discovered channels by the user.
- **Notion Integration:**
    - **Description:** Integration with Notion or other apps to allow users to sync their feeds or posts with their desired workspace for better organization or tracking.
    - **Benefits:** Provides users with the ability to integrate and use according to their needs or workflow.
- **YouTube Watch Playlist Creation:**
    - **Description:** To create YouTube watch playlists from a collection of posts, allowing users to have more control.
    - **Benefits:** Facilitates content curation and improves the user experience.

I would like feedback and suggestions for further improvements and features!

If you have ideas on how to enhance this project, please feel free to share them through issues or pull requests. 

## Contact

For any questions or feedback, please reach out to:

- :e-mail: **Email:** github@technologist.anonaddy.com
- :point_right: **LinkedIn:** [in/pratap-adit](https://www.linkedin.com/in/yourprofile)

---

Thank you for checking out my project! If this project helped / interests you, then give it a :star2: Star.
