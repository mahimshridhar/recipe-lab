const getUserId = require('../utils/getUserId');

module.exports = {
  author: ({ uid }, args, ctx) => {
    return ctx.prisma.recipe({ uid }).author();
  },
  items: ({ uid }, args, ctx) => {
    return ctx.prisma.recipe({ uid }).items({ orderBy: 'index_ASC' });
  },
  photo: async ({ uid }, args, ctx) => {
    const recipe = await ctx.prisma.recipe({ uid }).$fragment(`
      fragment RecipeWithAuthor on Recipe {
        photo
        author {
          slug
        }
      }
    `);
    if (!recipe.photo) return null;
    return `/public/${recipe.author.slug}/${recipe.photo}`;
  },
  modification: ({ uid }, { user }, ctx) => {
    if (!user) {
      try {
        user = getUserId(ctx);
      } catch {
        return undefined;
      }
    }

    return ctx.prisma
      .modifications({
        where: { recipe: { uid }, user: { id: user } }
      })
      .then(mods => mods.shift());
  }
};
