import Link from 'next/link'
import { Component } from 'react'
import Textarea from 'react-textarea-autosize'
import Swiper from 'react-id-swiper'
import DiffMatchPatch from 'diff-match-patch'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

import css from './Recipe.css'
import { stepsToIngredientTotals, formatIngredientTotal } from '../../util/recipeTools';

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
}

class Recipe extends Component {
  state = {
    activeItem: this.props.recipe.items[0],
    activeStep: this.props.recipe.items[0].steps[0],
    recipe: this.props.recipe,
    stepMods: [],
    editing: false,
  }

  toggleEdit = () => {
    if(this.state.editing === false) {
      this.setState({editing: true})
    } else {
      this.setState({editing: false})
    }
  }

  nextStep = () => {
    let { activeItem, activeStep, recipe } = this.state;
    const nextItemIndex = recipe.items.findIndex(item => item._id === activeItem._id) + 1
    const nextStepIndex = activeItem.steps.findIndex(step => step._id === activeStep._id) + 1
    if(nextStepIndex < activeItem.steps.length) {
      activeStep = activeItem.steps[nextStepIndex]
    } else if (nextItemIndex < recipe.items.length) {
      activeItem = recipe.items[nextItemIndex]
      activeStep = recipe.items[nextItemIndex].steps[0]
    }
    this.setState({ activeStep, activeItem })
  }

  prevStep = () => {
    let { activeItem, activeStep, recipe } = this.state;
    const prevItemIndex = recipe.items.findIndex(item => item._id === activeItem._id) - 1
    const prevStepIndex = activeItem.steps.findIndex(step => step._id === activeStep._id) - 1
    if(prevStepIndex >= 0) {
      activeStep = activeItem.steps[prevStepIndex]
    } else if (prevItemIndex >= 0) {
      activeItem = recipe.items[prevItemIndex]
      activeStep = recipe.items[prevItemIndex].steps[activeItem.steps.length - 1]
    }
    this.setState({ activeStep, activeItem })
  }

  handleStepChange = (e) => {
    const { name, value } = e.target
    const { recipe, activeStep, stepMods } = this.state
    const stepId = activeStep._id
    const modI = stepMods.findIndex( stepMod => stepMod.step === stepId )
    if(modI > -1) {
      stepMods[modI][name] = value
    } else {
      stepMods.push({
        step: stepId,
        [name]: value,
      })
    }
    this.setState({ stepMods })
  }

  getStepDirectionsValue = (step) => {
    const { stepMods } = this.state
    const mod = stepMods.find( stepMod => stepMod.step === step._id )
    if(mod) {
      return mod.directions
    }
    return step.directions
  }

  setActiveStep = (itemI, stepI) => {
    this.setState({
      activeItem: this.state.recipe.items[itemI],
      activeStep: this.state.recipe.items[itemI].steps[stepI],
    })
  }

  getDirectionsWithMods = (step) => {
    const { stepMods } = this.state
    const mod = stepMods.find( stepMod => stepMod.step === step._id )
    if(mod) {
      const dmp = new DiffMatchPatch()
      const diff = dmp.diff_main(step.directions, mod.directions)
      dmp.diff_cleanupSemantic(diff)
      return diff.map((match, i) => {
        switch(match[0]) {
          case 1:
            return <ins key={i}>{match[1]}</ins>
          case -1:
            return <del key={i}>{match[1]}</del>
          default:
            return <span key={i}>{match[1]}</span>
        }
      })
    }
    return step.directions
  }

  onDragEnd = result => {
    console.log(result)
    // dropped outside the list
    if (!result.destination) {
      return
    }

    const { recipe } = this.state

    if(result.type.startsWith('STEP')) {
      const itemId = result.destination.droppableId
      const itemIndex = recipe.items.findIndex( item => item._id === itemId)
      recipe.items[itemIndex].steps = reorder(
        recipe.items[itemIndex].steps,
        result.source.index,
        result.destination.index
      )
    }

    this.setState({
      recipe,
    })
  }

  render() {
    const { recipe, activeItem, activeStep, editing, mods } = this.state

    const swiperParams = {
      pagination: {
        el: '.swiper-pagination',
        type: 'bullets',
        clickable: true
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      spaceBetween: 20,
    }

    const activeItemIndex = recipe.items.findIndex(item => item._id === activeItem._id)
    const activeStepIndex = activeItem.steps.findIndex(step => step._id === activeStep._id)
    const hasPrevStep = (activeItemIndex === 0 && activeStepIndex > 0) || (activeItemIndex > 0)
    const hasNextStep = (activeItemIndex < recipe.items.length - 1) || (activeStepIndex < activeItem.steps.length - 1)

    return (
      <article className={css.recipe}>
        <div className={css.recipeMain}>
          {recipe.items.map(item => (
            <div key={item._id}>
              <h3>Ingredients for {item.name}</h3>
              <ul className={css.ingredients}>
                {stepsToIngredientTotals(item.steps).map((ingredient, i) => (
                  <li key={i}>
                    {formatIngredientTotal(ingredient)}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <DragDropContext onDragEnd={this.onDragEnd}>
            {recipe.items.map((item, itemI) => (
              <div key={item._id}>
                <h3>Directions for {item.name}</h3>
                  <Droppable type={`STEP-${itemI}`} droppableId={item._id}>
                    {(provided, snapshot) => (
                      <div
                        className={css.steps}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {item.steps.map((step, stepI) => (
                          <Draggable
                            type={`STEP-${itemI}`}
                            key={step._id}
                            draggableId={step._id}
                            index={stepI}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                data-active={activeItem._id === item._id && activeStep._id === step._id}
                              >
                                <div
                                  className={css.stepNum}
                                  {...provided.dragHandleProps}
                                >
                                  <span>
                                    {stepI + 1}.
                                  </span>
                                </div>
                                <div
                                  className={css.stepDirections}
                                  onClick={() => this.setActiveStep(itemI, stepI)}
                                >
                                  {this.getDirectionsWithMods(step)}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
              </div>
            ))}
          </DragDropContext>
        </div>
        <aside className={css.recipeDetail}>
          <div className={css.sticky}>
            <header className={css.recipeDetailHeader}>
              <div className={css.recipeDetailToolbar}>
                <h6>{activeItem.name} &gt; Step {activeStepIndex + 1}</h6>
                <div className={css.recipeActions}>
                  <button onClick={this.toggleEdit}>
                    <i className="material-icons">edit</i>
                  </button>
                  <button
                    onClick={this.prevStep}
                    disabled={!hasPrevStep}
                  >
                    <i className="material-icons">navigate_before</i>
                  </button>
                  <button
                    onClick={this.nextStep}
                    disabled={!hasNextStep}
                  >
                    <i className="material-icons">navigate_next</i>
                  </button>
                </div>
              </div>

              {editing ? (
                <Textarea
                  name="directions"
                  value={this.getStepDirectionsValue(activeStep)}
                  placeholder={activeStep.directions.length ? activeStep.directions : 'Directions'}
                  onChange={this.handleStepChange} />
              ) : (
                <p>
                  {this.getDirectionsWithMods(activeStep)}
                </p>
              )}
            </header>
            <div className={css.recipeDetailContent}>
              <Swiper {...swiperParams}>
                <img src={`https://loremflickr.com/530/300/food,cooking,spaghetti?s=${activeStep._id}_1`} />
                <img src={`https://loremflickr.com/530/300/food,cooking,spaghetti?s=${activeStep._id}_2`} />
                <img src={`https://loremflickr.com/530/300/food,cooking,spaghetti?s=${activeStep._id}_3`} />
              </Swiper>

              {activeStep.ingredients.length > 0 && (
                <div>
                  <h3>Ingredients Used</h3>
                  <ul className={css.ingredients}>
                    {activeStep.ingredients.map((ingredient, i) => (
                      <li key={i}>
                        {ingredient.quantity} {ingredient.unit} {ingredient.name}
                        {ingredient.processing && `, ${ingredient.processing}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <h3>Notes</h3>
              {editing ? (
                <Textarea
                  name="notes"
                  value={activeStep.notes}
                  placeholder="Additional Notes"
                  onChange={this.handleStepChange} />
              ) : (
                <p>
                  {activeStep.notes}
                </p>
              )}
            </div>
          </div>
        </aside>
      </article>
    )
  }
}

export default Recipe;
