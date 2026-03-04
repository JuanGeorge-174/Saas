# MongoDB Setup

1. Create a file named `.env.local` in the `frontend` directory.
2. Add your MongoDB connection string to it:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

3. The application will automatically connect to MongoDB when you use `import dbConnect from '@/lib/mongodb'` in your API routes or Server Actions.
