const { prisma } = require('../server/generated/prisma-client');
const cuid = require('cuid');

async function main() {
  await prisma.createUser({
    role: 'EXECUTIVE_CHEF',
    email: 'jay@recipelab.io',
    emailVerified: true,
    name: 'Jay',
    slug: 'jay',
    password: '$2b$10$dqyYw5XovLjpmkYNiRDEWuwKaRAvLaG45fnXE5b3KTccKZcRPka2m', // "secret42"
    recipes: {
      create: [
        {
          uid: cuid(),
          slug: 'spaghetti-meatballs',
          title: 'Spaghetti and Meatballs',
          time: 'Moderate',
          servingAmount: '4',
          servingType: 'plates',
          description:
            "It's spaghett! This super easy recipe is delcious, nutritious, and sure to be a crowd pleaser. Rice noodles done right are practically indistinguishable from their glutenfull counterparts.",
          items: {
            create: [
              {
                uid: cuid(),
                index: 0,
                name: 'Marinara Sauce',
                steps: {
                  create: [
                    {
                      uid: cuid(),
                      index: 0,
                      directions:
                        "Heat a large pot over medium-high heat. Add 2 tablespoons of the avocado oil, and when it's warm, saute the onion until it's brown and translucent",
                      notes:
                        'Try to cook the onions longer than you think will be necessary. Get them real carmelized. Yum Yum.',
                      ingredients: {
                        create: [
                          {
                            uid: cuid(),
                            index: 0,
                            name: 'avocado oil',
                            quantity: '2',
                            unit: 'tbsp'
                          },
                          {
                            uid: cuid(),
                            index: 1,
                            name: 'medium onion',
                            quantity: '1',
                            processing: 'chopped'
                          }
                        ]
                      }
                    },
                    {
                      uid: cuid(),
                      index: 1,
                      directions:
                        'Add the garlic and italian seasoning. Briefly stir and fry until the mixture is fragrant.',
                      notes: '',
                      ingredients: {
                        create: [
                          {
                            uid: cuid(),
                            index: 0,
                            name: 'garlic cloves',
                            quantity: '2',
                            processing: 'minced'
                          },
                          {
                            uid: cuid(),
                            index: 1,
                            name: 'italian seasoning',
                            quantity: '2',
                            unit: 'tsp'
                          }
                        ]
                      }
                    },
                    {
                      uid: cuid(),
                      index: 2,
                      directions:
                        'Add 1 cup of red wine and simmer the mixture until the liquid has reduced by half.',
                      notes: '',
                      ingredients: {
                        create: [
                          {
                            uid: cuid(),
                            index: 0,
                            name: 'red wine',
                            quantity: '1',
                            unit: 'cup'
                          }
                        ]
                      }
                    },
                    {
                      uid: cuid(),
                      index: 3,
                      directions:
                        'Add the remaining red wine, chicken stock, and tomato puree.',
                      notes: '',
                      ingredients: {
                        create: [
                          {
                            uid: cuid(),
                            index: 0,
                            name: 'red wine',
                            quantity: '1',
                            unit: 'cup'
                          },
                          {
                            uid: cuid(),
                            index: 1,
                            name: 'chicken stock',
                            quantity: '1/2',
                            unit: 'cup'
                          },
                          {
                            uid: cuid(),
                            index: 2,
                            name: '28-ounce can whole peeled tomatoes',
                            quantity: '1',
                            processing: 'blended into a puree'
                          }
                        ]
                      }
                    },
                    {
                      uid: cuid(),
                      index: 4,
                      directions:
                        'Make spaghetti noodles according to package instructions.',
                      notes: '',
                      ingredients: {
                        create: [
                          {
                            uid: cuid(),
                            index: 0,
                            name: 'gulten-free spaghetti',
                            quantity: '1',
                            unit: 'lb'
                          }
                        ]
                      }
                    }
                  ]
                }
              },
              {
                uid: cuid(),
                index: 1,
                name: 'Meatballs',
                steps: {
                  create: [
                    {
                      uid: cuid(),
                      index: 0,
                      directions: 'Preheat the oven to 350 F'
                    },
                    {
                      uid: cuid(),
                      index: 1,
                      directions:
                        'Stir together all the ingredients for the meatballs until they are well combined.',
                      ingredients: {
                        create: [
                          {
                            uid: cuid(),
                            index: 0,
                            quantity: '1',
                            unit: 'lb',
                            name: 'ground beef'
                          },
                          {
                            uid: cuid(),
                            index: 1,
                            quantity: '1/4',
                            unit: 'cup',
                            name: 'onion',
                            processing: 'minced'
                          },
                          {
                            uid: cuid(),
                            index: 2,
                            quantity: '1',
                            name: 'egg'
                          },
                          {
                            uid: cuid(),
                            index: 3,
                            quantity: '1',
                            unit: 'tbsp',
                            name: 'chia seeds'
                          },
                          {
                            uid: cuid(),
                            index: 4,
                            quantity: '2',
                            unit: 'tbsp',
                            name: 'almond flour'
                          },
                          {
                            uid: cuid(),
                            index: 5,
                            quantity: '1/4',
                            unit: 'cup',
                            name: 'parsley'
                          },
                          {
                            uid: cuid(),
                            index: 6,
                            quantity: '2',
                            unit: 'tsp',
                            name: 'sea salt'
                          },
                          {
                            uid: cuid(),
                            index: 7,
                            quantity: '1/4',
                            unit: 'tsp',
                            name: 'black pepper',
                            processing: 'freshly ground'
                          }
                        ]
                      }
                    },
                    {
                      uid: cuid(),
                      index: 2,
                      directions:
                        'Using your hands, form even size balls, about the size of golf balls, and set them aside. Heat another few tablespoons of avocado oil in an ovenproof saute pan. When the oil is hot, add the meatballs and brown them about 2 minutes on each side before transferring the pan to the oven. Cook them for about 10 minutes.',
                      ingredients: {
                        create: [
                          {
                            uid: cuid(),
                            index: 0,
                            quantity: '2',
                            unit: 'tbsp',
                            name: 'avocado oil'
                          }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    }
  });

  await prisma.createUser({
    role: 'EXECUTIVE_CHEF',
    email: 'emma@recipelab.io',
    emailVerified: true,
    name: 'Emma',
    slug: 'emma',
    password: '$2b$10$dqyYw5XovLjpmkYNiRDEWuwKaRAvLaG45fnXE5b3KTccKZcRPka2m', // "secret42"
    recipes: {
      create: [
        {
          uid: cuid(),
          slug: 'thai-chicken-curry',
          title: 'Thai Chicken Curry',
          time: 'Moderate',
          servingAmount: '6',
          servingType: 'Bowls',
          description:
            'This tasty and easy one pot meal is a perfect use for leftover chicken when you need something quick and nutritions on a week night',
          items: {
            create: [
              {
                uid: cuid(),
                index: 0,
                name: 'Curry',
                steps: {
                  create: [
                    {
                      uid: cuid(),
                      index: 0,
                      directions:
                        "Heat a large pot over medium-high heat. Add 2 tablespoons of butter, and when it's warm, saute the onion until it's brown and translucent",
                      notes:
                        'Try to cook the onions longer than you think will be necessary. Get them real carmelized. Yum Yum.',
                      ingredients: {
                        create: [
                          {
                            uid: cuid(),
                            index: 0,
                            name: 'Butter',
                            quantity: '2',
                            unit: 'tbsp'
                          },
                          {
                            uid: cuid(),
                            index: 1,
                            name: 'medium onion',
                            quantity: '1',
                            processing: 'chopped'
                          }
                        ]
                      }
                    },
                    {
                      uid: cuid(),
                      index: 1,
                      directions:
                        'Add the garlic. Briefly stir and fry until the mixture is fragrant. Then set the heat to low',
                      notes: '',
                      ingredients: {
                        create: [
                          {
                            uid: cuid(),
                            index: 0,
                            name: 'garlic cloves',
                            quantity: '2',
                            processing: 'minced'
                          }
                        ]
                      }
                    },
                    {
                      uid: cuid(),
                      index: 2,
                      directions: 'Add diced carrots',
                      notes: '',
                      ingredients: {
                        create: [
                          {
                            uid: cuid(),
                            index: 0,
                            name:
                              'Carrots - Rainbow carrots are fun and add some color',
                            quantity: '1/2',
                            unit: 'cup',
                            processing: 'diced'
                          }
                        ]
                      }
                    },
                    {
                      uid: cuid(),
                      index: 4,
                      directions:
                        'Add 1/2 cup of diced bell peppers (whatever color strikes your fancy) ',
                      notes:
                        'A colorful meal is a mouth watering meal. Try to use different coloros of carrots and peppers to make your curry striking and your own',
                      ingredients: {
                        create: [
                          {
                            uid: cuid(),
                            index: 0,
                            name: 'Bell peppers',
                            quantity: '2/3',
                            unit: 'cup',
                            processing: 'diced'
                          }
                        ]
                      }
                    },
                    {
                      uid: cuid(),
                      index: 4,
                      directions: 'Add chicken and stir all ingredients',
                      notes:
                        'If you have leftover chicken from a roast, use it here! Shread it quickly in a food processer and toss it in. If you need to cook your chicken, cube it and saute it with the veggies',
                      ingredients: {
                        create: [
                          {
                            uid: cuid(),
                            index: 0,
                            name: 'Chicken',
                            quantity: '1',
                            unit: 'cup',
                            processing: 'cubed or pulled'
                          }
                        ]
                      }
                    },
                    {
                      uid: cuid(),
                      index: 3,
                      directions:
                        'Add chicken stock, and coconut milk. Set burner to medium low heat and simmer until veggies are soft and chicken is cooked',
                      notes: '',
                      ingredients: {
                        create: [
                          {
                            uid: cuid(),
                            index: 0,
                            name: 'Chicken stock',
                            quantity: '1',
                            unit: 'cup'
                          },
                          {
                            uid: cuid(),
                            index: 1,
                            name: 'Coconut milk',
                            quantity: '1',
                            unit: 'can'
                          }
                        ]
                      }
                    },
                    {
                      uid: cuid(),
                      index: 4,
                      directions:
                        'While the curry is simmering, cook 1/2 cup of qunioa as directed on package',
                      notes: '',
                      ingredients: {
                        create: [
                          {
                            uid: cuid(),
                            index: 0,
                            name: 'qunioa',
                            quantity: '1/2',
                            unit: 'Cup'
                          }
                        ]
                      }
                    },
                    {
                      uid: cuid(),
                      index: 4,
                      directions:
                        'Optional: Chop up greens for an extra dose of greens',
                      notes:
                        'The body cannot have enogh greens. Chopping some greens like spinich or kale and placing it a the bottom of a curry bowl adds some extra color and veggies',
                      ingredients: {
                        create: [
                          {
                            uid: cuid(),
                            index: 0,
                            name: 'Greens',
                            quantity: '1/2',
                            unit: 'Cup',
                            processing: 'Chopped'
                          }
                        ]
                      }
                    },
                    {
                      uid: cuid(),
                      index: 4,
                      directions:
                        'Add lime juice, ginger, cayanne pepper and salt to taste',
                      notes: '',
                      ingredients: {
                        create: [
                          {
                            uid: cuid(),
                            index: 0,
                            name: 'Lime',
                            quantity: '1',
                            unit: 'Whole lime',
                            processing: 'Squeezed'
                          },
                          {
                            uid: cuid(),
                            index: 0,
                            name: 'Powdered ginger',
                            quantity: '1',
                            unit: 'tsp'
                          },
                          {
                            uid: cuid(),
                            index: 0,
                            name: 'Cayanne pepper',
                            quantity: '1/2',
                            unit: 'tsp'
                          },
                          {
                            uid: cuid(),
                            index: 0,
                            name: 'Salt',
                            quantity: '1',
                            unit: 'tsp'
                          }
                        ]
                      }
                    },
                    {
                      uid: cuid(),
                      index: 4,
                      directions:
                        'Place qunioa at the bottom of the bowl, add optional chopped greens and then put the curry on top. Eat until you are good and full',
                      notes:
                        'If you want some extra color or flavor. Add a diced radish or pumpkin seeds to the top of the bowl.'
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    }
  });
}

main();
