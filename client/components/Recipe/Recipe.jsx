import React from 'react';
import { Component } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext } from 'react-beautiful-dnd';
import cuid from 'cuid';

import reorder from '../../utils/reorder';
import areArraysEqual from '../../utils/areArraysEqual';
import UserContext from '../../utils/UserContext';

import RecipeDetails from '../RecipeDetails';
import RecipePhoto from '../RecipePhoto/RecipePhoto';
import RecipeBio from '../RecipeBio';
import StepList from '../StepList';
import Step from '../Step';
import ItemList from '../ItemList';
import Item from '../Item';
import IngredientList from '../IngredientList';
import Ingredient from '../Ingredient';
import IngredientTotals from '../IngredientTotals';
import RecipeStatus from '../RecipeStatus';

import css from './Recipe.css';

export default class Recipe extends Component {
  static displayName = 'Recipe';
  static contextType = UserContext;

  static propTypes = {
    recipe: PropTypes.shape({
      uid: PropTypes.string,
      title: PropTypes.string,
      author: PropTypes.object,
      time: PropTypes.string,
      skill: PropTypes.string,
      description: PropTypes.string,
      servingAmount: PropTypes.string,
      servingType: PropTypes.string,
      items: PropTypes.arrayOf(PropTypes.object),
      photo: PropTypes.string
    }),
    modification: PropTypes.object
  };

  state = {
    unsavedCount: 0,
    localStoreId: this.props.recipe
      ? `MOD-${this.props.recipe.uid}`
      : 'MOD-NEW-RECIPE',
    recipe: this.props.recipe ? this.props.recipe : null,
    modification: this.props.modification
      ? this.props.modification
      : {
          sortings: [],
          alterations: [],
          removals: [],
          additions: []
        }
  };

  // componentDidMount() {
  //   let { modification } = this.state;
  //   if (localStorage.getItem(localStoreId)) {
  //     modification = Object.assign(
  //       modification,
  //       JSON.parse(localStorage.getItem(localStoreId))
  //     );
  //   }
  //   this.setState({ modification });
  // }

  setModification = modification => {
    const { localStoreId } = this.state;
    let { unsavedCount } = this.state;
    unsavedCount++;
    localStorage.setItem(localStoreId, JSON.stringify(modification));
    this.setState({ modification, unsavedCount });
  };

  saveAlteration = (source, field, value) => {
    const { modification } = this.state;
    const alterationIndex = modification.alterations.findIndex(
      alteration =>
        alteration.field === field && alteration.sourceId === source.uid
    );
    const alterationExists = alterationIndex > -1;

    if (!alterationExists && source[field] === value) return;

    if (alterationExists && source[field] === value) {
      // Remove exisitng alteration if the new value is the same as the source
      modification.alterations.splice(alterationIndex, 1);
    } else if (alterationExists) {
      // Update existing alteration
      modification.alterations[alterationIndex].value = value;
    } else {
      // Add new alteration
      modification.alterations.push({
        uid: cuid(),
        sourceId: source.uid,
        field,
        value
      });
    }

    this.setModification(modification);
  };

  updateAddition = (source, field, value) => {
    const { modification } = this.state;

    const index = modification.additions.findIndex(
      addition => addition.uid === source.uid
    );

    if (index === -1) return;

    modification.additions[index][field] = value;

    this.setModification(modification);
  };

  saveOrUpdateField = (source, fieldName, value) => {
    if ('kind' in source) {
      this.updateAddition(source, fieldName, value);
    } else {
      this.saveAlteration(source, fieldName, value);
    }
  };

  saveRemoval = source => {
    const { modification } = this.state;

    // source was already removed
    if (modification.removals.includes(source.uid)) return;

    modification.removals.push(source.uid);

    // Clear any saved alterations for the deleted ingredient
    modification.alterations = modification.alterations.filter(
      mod => mod.sourceId !== source.uid
    );

    this.setModification(modification);
  };

  deleteAdditions = (...sources) => {
    const { modification } = this.state;
    sources.forEach(source => {
      const index = modification.additions.findIndex(
        addition => addition.uid === source.uid
      );
      modification.additions.splice(index, 1);
    });
    this.setModification(modification);
  };

  removeIngredient = ingredient => {
    if ('kind' in ingredient) {
      this.deleteAdditions(ingredient);
    } else {
      this.saveRemoval(ingredient);
    }
  };

  removeStep = step => {
    if ('kind' in step) {
      this.deleteAdditions(step, ...this.getUnsortedIngredients(step));
    } else {
      this.saveRemoval(step);
    }
  };

  removeItem = item => {
    if ('kind' in item) {
      const steps = this.getUnsortedSteps(item);
      const ingredients = steps.reduce((result, step) => {
        const stepIngredients = this.getUnsortedIngredients(step);
        if (stepIngredients.length) result.push(...stepIngredients);
        return result;
      }, []);
      this.deleteAdditions(item, ...steps, ...ingredients);
    } else {
      this.saveRemoval(item);
    }
  };

  undoRemoval = source => {
    const { modification } = this.state;
    const removalIndex = modification.removals.indexOf(source.uid);

    if (removalIndex === -1) return;

    modification.removals.splice(removalIndex, 1);

    this.setModification(modification);
  };

  undoAnyRemovals = (...sources) => {
    sources.forEach(source => this.undoRemoval(source));
  };

  saveSorting = (parentId, unsorted, sourceI, destinationI) => {
    const { modification } = this.state;
    const sortingIndex = modification.sortings.findIndex(
      sorting => sorting.parentId === parentId
    );
    const sortingExists = sortingIndex > -1;
    const sorted = sortingExists
      ? this.getSorted(parentId, unsorted)
      : unsorted;

    const order = reorder(sorted, sourceI, destinationI).map(
      child => child.uid
    );

    if (
      sortingExists &&
      areArraysEqual(order, unsorted.map(child => child.uid))
    ) {
      // Remove existing sorting if the new value is the same as the source
      modification.sortings.splice(sortingIndex, 1);
    } else if (sortingExists) {
      // Update existing sorting
      modification.sortings[sortingIndex].order = order;
    } else {
      // Add new sorting
      modification.sortings.push({
        uid: cuid(),
        parentId,
        order
      });
    }

    this.setModification(modification);
  };

  onDragEnd = result => {
    // dropped outside the list or dropped in place
    if (!result.destination || result.destination.index === result.source.index)
      return;

    const { recipe } = this.state;

    if (result.type.startsWith('ITEM')) {
      this.saveSorting(
        recipe.uid,
        this.getUnsortedItems(),
        result.source.index,
        result.destination.index
      );
    } else if (result.type.startsWith('STEP')) {
      const itemId = result.destination.droppableId;
      const item = this.getUnsortedItems().find(item => item.uid === itemId);
      this.saveSorting(
        itemId,
        this.getUnsortedSteps(item),
        result.source.index,
        result.destination.index
      );
    } else if (result.type.startsWith('INGREDIENT')) {
      const stepId = result.destination.droppableId;
      const step = this.getUnsortedItems()
        .flatMap(item => this.getUnsortedSteps(item))
        .find(step => step.uid === stepId);
      this.saveSorting(
        stepId,
        this.getUnsortedIngredients(step),
        result.source.index,
        result.destination.index
      );
    }
  };

  createItem = () => {
    const { recipe, modification } = this.state;

    const addition = {
      uid: cuid(),
      kind: 'Item',
      parentId: recipe.uid,
      name: '',
      processing: ''
    };

    modification.additions.push(addition);
    this.setModification(modification);
  };

  createStep = itemId => {
    const { modification } = this.state;

    const addition = {
      uid: cuid(),
      kind: 'Step',
      parentId: itemId,
      directions: '',
      notes: ''
    };

    modification.additions.push(addition);
    this.setModification(modification);
  };

  createIngredient = stepId => {
    const { modification } = this.state;

    const addition = {
      uid: cuid(),
      kind: 'Ingredient',
      parentId: stepId,
      quantity: '',
      unit: '',
      name: '',
      processing: ''
    };

    modification.additions.push(addition);

    this.setModification(modification);
    this.setState({ activeIngredient: addition });
  };

  getSorted = (parentId, arr) => {
    const { modification } = this.state;
    const sortMod = modification.sortings.find(
      mod => mod.parentId === parentId
    );

    if (sortMod === undefined) return arr;

    return [...arr].sort((a, b) => {
      const indexA = sortMod.order.indexOf(a.uid);
      const indexB = sortMod.order.indexOf(b.uid);
      if (indexB === -1) return 0;
      return indexA > indexB;
    });
  };

  getItems = (sorted = true) => {
    const { recipe, modification } = this.state;

    if (!recipe) return [];

    const addedItems = modification.additions.filter(
      addition => addition.parentId === recipe.uid
    );

    const items = addedItems.length
      ? recipe.items.concat(addedItems)
      : recipe.items;

    return sorted ? this.getSorted(recipe.uid, items) : items;
  };

  getUnsortedItems = () => {
    return this.getItems(false);
  };

  getSteps = (item, sorted = true) => {
    const { modification } = this.state;
    const steps = modification.additions.filter(
      addition => addition.parentId === item.uid
    );
    if ('steps' in item) steps.unshift(...item.steps);
    return sorted ? this.getSorted(item.uid, steps) : steps;
  };

  getUnsortedSteps = item => {
    return this.getSteps(item, false);
  };

  getIngredients = (step, sorted = true) => {
    const { modification } = this.state;
    const ingredients = modification.additions.filter(
      addition => addition.parentId === step.uid
    );
    if ('ingredients' in step) ingredients.unshift(...step.ingredients);
    return sorted ? this.getSorted(step.uid, ingredients) : ingredients;
  };

  getUnsortedIngredients = step => {
    return this.getIngredients(step, false);
  };

  getAlteration = (source, fieldName) => {
    const { modification } = this.state;
    const mod = modification.alterations.find(
      mod => mod.sourceId === source.uid && mod.field === fieldName
    );
    return mod ? mod.value : undefined;
  };

  getFieldValue = (source, fieldName) => {
    const mod = this.getAlteration(source, fieldName);
    return mod !== undefined ? mod : source[fieldName];
  };

  setRecipePhoto = photo => {
    const { recipe } = this.state;
    this.setState({ recipe: { ...recipe, photo } });
  };

  render() {
    const { recipe, modification, unsavedCount } = this.state;
    const { user } = this.context;
    const recipeItems = this.getItems();

    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <header className={css.recipeHeader}>
          <RecipeDetails
            className={css.recipeDetails}
            recipe={recipe}
            recipeMods={modification.alterations.filter(
              alteration => alteration.sourceId === recipe.uid
            )}
            saveAlteration={this.saveAlteration}
            setRecipePhoto={this.setRecipePhoto}
          />
          <RecipePhoto
            className={css.recipePhoto}
            setRecipePhoto={this.setRecipePhoto}
            recipe={recipe}
          />
        </header>

        <article className={css.recipe}>
          <div className={css.recipeMain}>
            {recipe && (
              <ItemList recipeId={recipe.uid}>
                {recipeItems.map((item, itemI) => {
                  const itemSteps = this.getSteps(item);
                  return (
                    <Item
                      key={item.uid}
                      item={item}
                      itemMods={modification.alterations.filter(
                        mod => mod.sourceId === item.uid
                      )}
                      index={itemI}
                      isLast={itemI === recipeItems.length - 1}
                      removed={modification.removals.includes(item.uid)}
                      removeItem={() => this.removeItem(item)}
                      restoreItem={() => this.undoRemoval(item)}
                      createStep={() => this.createStep(item.uid)}
                      createItem={this.createItem}
                      saveOrUpdateField={this.saveOrUpdateField}
                    >
                      {itemSteps.length > 0 && (
                        <StepList itemId={item.uid}>
                          {itemSteps.map((step, stepI) => (
                            <Step
                              key={step.uid}
                              index={stepI}
                              itemId={item.uid}
                              step={step}
                              stepMods={modification.alterations.filter(
                                mod => mod.sourceId === step.uid
                              )}
                              removed={modification.removals.some(sourceId =>
                                [item.uid, step.uid].includes(sourceId)
                              )}
                              saveOrUpdateField={this.saveOrUpdateField}
                              removeStep={() => this.removeStep(step)}
                              restoreStep={() =>
                                this.undoAnyRemovals(item, step)
                              }
                              createIngredient={() =>
                                this.createIngredient(step.uid)
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  {isActive && (
                                    <IngredientList stepId={step.uid}>
                                      {this.getIngredients(step).map(
                                        (ingredient, i) => (
                                          <Ingredient
                                            key={ingredient.uid}
                                            index={i}
                                            ingredient={ingredient}
                                            ingredientMods={modification.alterations.filter(
                                              mod =>
                                                mod.sourceId === ingredient.uid
                                            )}
                                            removed={modification.removals.some(
                                              sourceId =>
                                                [
                                                  item.uid,
                                                  step.uid,
                                                  ingredient.uid
                                                ].includes(sourceId)
                                            )}
                                            removeIngredient={() =>
                                              this.removeIngredient(ingredient)
                                            }
                                            restoreIngredient={() =>
                                              this.undoAnyRemovals(
                                                item,
                                                step,
                                                ingredient
                                              )
                                            }
                                            saveOrUpdateField={
                                              this.saveOrUpdateField
                                            }
                                          />
                                        )
                                      )}
                                    </IngredientList>
                                  )}
                                </>
                              )}
                            </Step>
                          ))}
                        </StepList>
                      )}
                    </Item>
                  );
                })}
              </ItemList>
            )}

            {!recipe && <p>you gotta finish creating your recipe, dude!</p>}
          </div>
          <aside className={css.stepDetail}>
            <div className={css.sticky}>
              <RecipeStatus
                recipe={recipe}
                modification={modification}
                unsavedCount={unsavedCount}
                updateModification={modification =>
                  this.setState({ modification })
                }
              />
              <div className={css.ingredientTotals}>
                {recipeItems
                  .filter(item => !modification.removals.includes(item.uid))
                  .map(item => (
                    <div key={item.uid}>
                      <h3>
                        Ingredients for {this.getFieldValue(item, 'name')}
                      </h3>
                      <IngredientTotals
                        ingredients={this.getSteps(item)
                          .filter(
                            step => !modification.removals.includes(step.uid)
                          )
                          .reduce((result, step) => {
                            return result.concat(
                              this.getIngredients(step).filter(
                                ingredient =>
                                  !modification.removals.includes(
                                    ingredient.uid
                                  )
                              )
                            );
                          }, [])}
                        removals={modification.removals}
                        alterations={modification.alterations}
                      />
                    </div>
                  ))}
              </div>
            </div>
          </aside>
        </article>
        <RecipeBio author={recipe ? recipe.author : user} />
      </DragDropContext>
    );
  }
}
