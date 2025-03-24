import User from '../models/User.js';
import { AuthenticationError } from 'apollo-server-express';
import { signToken } from '../services/auth.js';

interface IUserContext {
    user: {
        _id: string;
        email: string;
        username: string;
    };
}

interface IBookInput {
    title: string;
    authors: string[];
    description: string;
    bookId: string;
    image: string;
    link: string;
}


const resolvers = {
    Query: {
        me: async (_parent: any, _args: any, context: IUserContext): Promise<any> => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password')
                    .populate('savedBooks');
                    

                return userData;
            }

            throw new AuthenticationError('Not logged in');
        }

    },
    Mutation: {
        login: async (_parent: any, { email, password }: { email: string; password: string }): Promise<any> => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user.username, user.email, user._id);

            return { token, user };
        },
        addUser: async (_parent: any, args: any): Promise<any> => {
            const user = await User.create(args);
            const token = signToken(user.username, user.email, user._id);

            return { token, user };
        },
        saveBook: async (_parent: any, { input }: {input: IBookInput}, context: IUserContext): Promise<any> => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $push: { savedBooks: input } },
                    { new: true }
                );

                return updatedUser;
            }

            throw new AuthenticationError('You need to be logged in!');
        },
        removeBook: async (_parent: any, { bookId }: { bookId: string }, context: IUserContext): Promise<any> => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId } } },
                    { new: true }
                );

                return updatedUser;
            }

            throw new AuthenticationError('You need to be logged in!');
        }
    }


};

export default resolvers;