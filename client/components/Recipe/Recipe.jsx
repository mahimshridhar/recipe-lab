import React from 'react';
import { Component } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext } from 'react-beautiful-dnd';
import cuid from 'cuid';

import css from './Recipe.css';

import reorder from '../../utils/reorder';
import areArraysEqual from '../../utils/areArraysEqual';

import StepList from '../StepList';
import Step from '../Step';
import ItemList from '../ItemList';
import Item from '../Item';
import ItemName from '../ItemName';
import IngredientList from '../IngredientList';
import Ingredient from '../Ingredient';
import IngredientTotals from '../IngredientTotals';
import StepHeader from '../StepHeader';
// import StepCarousel from '../StepCarousel';
import RecipeNav from '../RecipeNav';
import Directions from '../Directions';
import RecipeStatus from '../RecipeStatus';

export default class Recipe extends Component {
  static displayName = 'Recipe';

  static propTypes = {
    recipe: PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      author: PropTypes.object,
      time: PropTypes.string,
      skill: PropTypes.string,
      description: PropTypes.string,
      course: PropTypes.string,
      items: PropTypes.arrayOf(PropTypes.object)
    })
  };

  state = {
    recipe: this.props.recipe,
    activeItem: this.props.recipe.items[0],
    activeStep: this.props.recipe.items[0].steps[0],
    activeIngredient: null,
    autoFocusId: null,
    localStoreId: `MOD-${this.props.recipe.id}`,
    unsavedCount: 0,
    modification: {
      sortings: [],
      alterations: [],
      removals: [],
      additions: []
    }
  };

  componentDidMount() {
    const { localStoreId } = this.state;
    let { modification, recipe } = this.state;

    if (recipe.modification) {
      modification = Object.assign(modification, recipe.modification);
    }

    // if (localStorage.getItem(localStoreId)) {
    //   modification = Object.assign(
    //     modification,
    //     JSON.parse(localStorage.getItem(localStoreId))
    //   );
    // }

    this.setState({ modification });
  }

  setActiveStep = (item, step) => {
    this.setState({
      activeItem: item,
      activeStep: step
    });
  };

  setActiveIngredient = ingredient => {
    this.setState({ activeIngredient: ingredient });
  };

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
        alteration.field === field && alteration.sourceId === source.id
    );
    const alterationExists = alterationIndex > -1;

    if (!alterationExists && source[field] === value) return;

    const alteration = {
      sourceId: source.id,
      field,
      value
    };

    if (alterationExists && source[field] === value) {
      // Remove exisitng alteration if the new value is the same as the source
      modification.alterations.splice(alterationIndex, 1);
    } else if (alterationExists) {
      // Update existing alteration
      modification.alterations[alterationIndex] = alteration;
    } else {
      // Add new alteration
      modification.alterations.push(alteration);
    }

    this.setModification(modification);
  };

  updateAddition = (source, field, value) => {
    const { modification, localStoreId } = this.state;

    const index = modification.additions.findIndex(
      addition => addition.id === source.id
    );

    if (index === -1) return;

    modification.additions[index][field] = value;
    localStorage.setItem(localStoreId, JSON.stringify(modification));
    this.setState({ modification });
  };

  saveOrUpdateField = (source, fieldName, value) => {
    if ('kind' in source) {
      this.updateAddition(source, fieldName, value);
    } else {
      this.saveAlteration(source, fieldName, value);
    }
  };

  handleItemChange = (e, item) => {
    const { name, value } = e.target;
    const { activeItem } = this.state;
    const source = item !== undefined ? item : activeItem;
    this.saveOrUpdateField(source, name, value);
  };

  handleStepChange = e => {
    const { name, value } = e.target;
    const { activeStep } = this.state;
    this.saveOrUpdateField(activeStep, name, value);
  };

  saveRemoval = source => {
    const { modification, localStoreId } = this.state;

    // source was already removed
    if (modification.removals.includes(source.id)) return;

    modification.removals.push(source.id);

    // Clear any saved alterations for the deleted ingredient
    modification.alterations = modification.alterations.filter(
      mod => mod.sourceId !== source.id
    );

    this.setState({ modification });
    localStorage.setItem(localStoreId, JSON.stringify(modification));
  };

  deleteAdditions = (...sources) => {
    const { modification } = this.state;
    sources.forEach(source => {
      const index = modification.additions.findIndex(
        addition => addition.id === source.id
      );
      modification.additions.splice(index, 1);
    });
    this.setState({ modification });
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
    const { modification, localStoreId } = this.state;
    const removalIndex = modification.removals.indexOf(source.id);

    if (removalIndex === -1) return;

    modification.removals.splice(removalIndex, 1);

    this.setState({ modification });
    localStorage.setItem(localStoreId, JSON.stringify(modification));
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

    const sorting = {
      parentId,
      order: reorder(sorted, sourceI, destinationI).map(child => child.id)
    };

    if (
      sortingExists &&
      areArraysEqual(sorting.order, unsorted.map(child => child.id))
    ) {
      // Remove existing sorting if the new value is the same as the source
      modification.sortings.splice(sortingIndex, 1);
    } else if (sortingExists) {
      // Update existing sorting
      modification.sortings[sortingIndex] = sorting;
    } else {
      // Add new sorting
      modification.sortings.push(sorting);
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
        recipe.id,
        this.getUnsortedItems(),
        result.source.index,
        result.destination.index
      );
    } else if (result.type.startsWith('STEP')) {
      const itemId = result.destination.droppableId;
      const item = recipe.items.find(item => item.id === itemId);
      this.saveSorting(
        itemId,
        this.getUnsortedSteps(item),
        result.source.index,
        result.destination.index
      );
    }
  };

  createItem = () => {
    const { recipe, modification, localStoreId } = this.state;

    const addition = {
      id: cuid(),
      kind: 'Item',
      parentId: recipe.id,
      name: ''
    };

    modification.additions.push(addition);
    localStorage.setItem(localStoreId, JSON.stringify(modification));
    this.setState({ modification, autoFocusId: addition.id });
  };

  createStep = itemId => {
    const { modification, localStoreId } = this.state;

    const addition = {
      id: cuid(),
      kind: 'Step',
      parentId: itemId,
      directions: '',
      notes: ''
    };

    modification.additions.push(addition);
    localStorage.setItem(localStoreId, JSON.stringify(modification));
    this.setState({ modification, autoFocusId: addition.id });
  };

  createIngredient = async stepId => {
    const { modification, localStoreId } = this.state;

    const addition = {
      id: cuid(),
      kind: 'Ingredient',
      parentId: stepId,
      quantity: '',
      unit: '',
      name: '',
      processing: ''
    };

    modification.additions.push(addition);
    localStorage.setItem(localStoreId, JSON.stringify(modification));
    await this.setState({ modification });
    setTimeout(() => {
      this.setState({ activeIngredient: addition });
    }, 200);
  };

  getSorted = (parentId, arr) => {
    const { modification } = this.state;
    const sortMod = modification.sortings.find(
      mod => mod.parentId === parentId
    );

    if (sortMod === undefined) return arr;

    return [...arr].sort((a, b) => {
      const indexA = sortMod.order.indexOf(a.id);
      const indexB = sortMod.order.indexOf(b.id);
      if (indexB === -1) return 0;
      return indexA > indexB;
    });
  };

  getItems = (sorted = true) => {
    const { recipe, modification } = this.state;
    const addedItems = modification.additions.filter(
      addition => addition.parentId === recipe.id
    );
    const items = addedItems.length
      ? recipe.items.concat(addedItems)
      : recipe.items;
    return sorted ? this.getSorted(recipe.id, items) : items;
  };

  getUnsortedItems = () => {
    return this.getItems(false);
  };

  getSteps = (item, sorted = true) => {
    const { modification } = this.state;
    const steps = modification.additions.filter(
      addition => addition.parentId === item.id
    );
    if ('steps' in item) steps.unshift(...item.steps);
    return sorted ? this.getSorted(item.id, steps) : steps;
  };

  getUnsortedSteps = item => {
    return this.getSteps(item, false);
  };

  getIngredients = (step, sorted = true) => {
    const { modification } = this.state;
    const ingredients = modification.additions.filter(
      addition => addition.parentId === step.id
    );
    if ('ingredients' in step) ingredients.unshift(...step.ingredients);
    return sorted ? this.getSorted(step.id, ingredients) : ingredients;
  };

  getUnsortedIngredients = step => {
    return this.getIngredients(step, false);
  };

  getAlteration = (source, fieldName) => {
    const { modification } = this.state;
    const mod = modification.alterations.find(
      mod => mod.sourceId === source.id && mod.field === fieldName
    );
    return mod ? mod.value : undefined;
  };

  getFieldValue = (source, fieldName) => {
    const mod = this.getAlteration(source, fieldName);
    return mod !== undefined ? mod : source[fieldName];
  };

  getActiveStepNumber = () => {
    const { activeItem, activeStep } = this.state;
    return (
      this.getSteps(activeItem).findIndex(step => step.id === activeStep.id) + 1
    );
  };

  render() {
    const {
      recipe,
      activeItem,
      activeStep,
      activeIngredient,
      autoFocusId,
      modification,
      unsavedCount
    } = this.state;

    const recipeItems = this.getItems();
    const activeStepIngredients = this.getIngredients(activeStep);

    return (
      <>
        <RecipeStatus
          recipe={recipe}
          modification={modification}
          unsavedCount={unsavedCount}
          updateModification={modification => this.setState({ modification })}
        />
        <article className={css.recipe}>
          <div className={css.recipeMain}>
            <div className={css.ingredientTotals}>
              {recipeItems
                .filter(item => !modification.removals.includes(item.id))
                .map(item => (
                  <div key={item.id}>
                    <h3>Ingredients for {this.getFieldValue(item, 'name')}</h3>
                    <IngredientTotals
                      ingredients={this.getSteps(item)
                        .filter(
                          step => !modification.removals.includes(step.id)
                        )
                        .reduce((result, step) => {
                          return result.concat(
                            this.getIngredients(step).filter(
                              ingredient =>
                                !modification.removals.includes(ingredient.id)
                            )
                          );
                        }, [])}
                      removals={modification.removals}
                      alterations={modification.alterations}
                    />
                  </div>
                ))}
            </div>

            <DragDropContext onDragEnd={this.onDragEnd}>
              <ItemList recipeId={recipe.id}>
                {recipeItems.map((item, itemI) => {
                  const itemSteps = this.getSteps(item);
                  return (
                    <Item
                      key={item.id}
                      itemId={item.id}
                      index={itemI}
                      isLast={itemI === recipeItems.length - 1}
                      focusOnMount={autoFocusId === item.id}
                      removed={modification.removals.includes(item.id)}
                      removeItem={() => this.removeItem(item)}
                      restoreItem={() => this.undoRemoval(item)}
                      createStep={() => this.createStep(item.id)}
                      createItem={this.createItem}
                      itemNameValue={this.getFieldValue(item, 'name')}
                      itemName={
                        <ItemName
                          item={item}
                          prefix="Directions for"
                          mod={this.getAlteration(item, 'name')}
                          handleItemChange={this.handleItemChange}
                        />
                      }
                    >
                      {itemSteps.length > 0 && (
                        <StepList itemId={item.id}>
                          {itemSteps.map((step, stepI) => (
                            <Step
                              key={step.id}
                              index={stepI}
                              itemId={item.id}
                              stepId={step.id}
                              directionsValue={this.getFieldValue(
                                step,
                                'directions'
                              )}
                              removed={modification.removals.some(sourceId =>
                                [item.id, step.id].includes(sourceId)
                              )}
                              isActive={
                                activeItem.id === item.id &&
                                activeStep.id === step.id
                              }
                              focusOnMount={autoFocusId === step.id}
                              activateStep={() =>
                                this.setActiveStep(item, step)
                              }
                              removeStep={() => this.removeStep(step)}
                              restoreStep={() =>
                                this.undoAnyRemovals(item, step)
                              }
                              directions={
                                <Directions
                                  directions={step.directions}
                                  mod={this.getAlteration(step, 'directions')}
                                  handleStepChange={this.handleStepChange}
                                />
                              }
                            />
                          ))}
                        </StepList>
                      )}
                    </Item>
                  );
                })}
              </ItemList>
            </DragDropContext>
          </div>
          <aside className={css.recipeDetail}>
            <div className={css.sticky}>
              <StepHeader
                activeStep={activeStep}
                removed={modification.removals.some(sourceId =>
                  [activeItem.id, activeStep.id].includes(sourceId)
                )}
                removeStep={() => this.saveRemoval(activeStep)}
                restoreStep={() => this.undoAnyRemovals(activeItem, activeStep)}
                itemName={
                  <ItemName
                    item={activeItem}
                    removed={modification.removals.includes(activeItem.id)}
                    restoreItem={() => this.undoRemoval(activeItem)}
                    suffix={`> Step ${this.getActiveStepNumber()}`}
                    mod={this.getAlteration(activeItem, 'name')}
                    handleItemChange={this.handleItemChange}
                  />
                }
                navigation={
                  <RecipeNav
                    recipeItems={recipeItems}
                    recipeSteps={recipeItems.map(item => this.getSteps(item))}
                    activeItem={activeItem}
                    activeStep={activeStep}
                    setActiveStep={this.setActiveStep}
                  />
                }
                directions={
                  <Directions
                    directions={activeStep.directions}
                    mod={this.getAlteration(activeStep, 'directions')}
                    handleStepChange={this.handleStepChange}
                  />
                }
              />
              <div className={css.recipeDetailContent}>
                {/* <StepCarousel /> */}

                <h3>Ingredients Used</h3>
                <IngredientList
                  createIngredient={() => this.createIngredient(activeStep.id)}
                  editing={
                    activeIngredient !== null &&
                    activeStepIngredients.some(
                      ingredient => ingredient.id === activeIngredient.id
                    )
                  }
                >
                  {activeStepIngredients.map(ingredient => (
                    <Ingredient
                      key={ingredient.id}
                      ingredient={ingredient}
                      ingredientMods={modification.alterations.filter(
                        mod => mod.sourceId === ingredient.id
                      )}
                      removed={modification.removals.some(sourceId =>
                        [activeItem.id, activeStep.id, ingredient.id].includes(
                          sourceId
                        )
                      )}
                      editing={
                        activeIngredient !== null &&
                        activeIngredient.id === ingredient.id
                      }
                      removeIngredient={() => this.removeIngredient(ingredient)}
                      restoreIngredient={() =>
                        this.undoAnyRemovals(activeItem, activeStep, ingredient)
                      }
                      saveOrUpdateField={this.saveOrUpdateField}
                      setActiveIngredient={this.setActiveIngredient}
                    />
                  ))}
                </IngredientList>
              </div>
            </div>
          </aside>
        </article>
      </>
    );
  }
}
