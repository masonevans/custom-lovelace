class GroupCard extends HTMLElement {

  setConfig(config) {
    if (!config.group) {
      throw new Error('Please specify a group');
    }
    if (!config.expand_groups) config.expand_groups = false

    if (this.lastChild) this.removeChild(this.lastChild);
    const cardConfig = Object.assign({}, config);
    if (!cardConfig.card) cardConfig.card = {};
    if (!cardConfig.card.type) cardConfig.card.type = 'entities';
    const element = document.createElement(`hui-${cardConfig.card.type}-card`);
    this.appendChild(element);
    this._config = cardConfig;
  }

  set hass(hass) {
    const config = this._config;
    const entities = config.expand_groups ? 
                       this.expandGroups(hass, config) 
		               : hass.states[config.group].attributes['entity_id']

    if (!config.card.entities || config.card.entities.length !== entities.length ||
      !config.card.entities.every((value, index) => value.entity === entities[index].entity)) {
      config.card.entities = entities;
    }
    this.lastChild.setConfig(config.card);
    this.lastChild.hass = hass;
  }

  getCardSize() {
    return 'getCardSize' in this.lastChild ? this.lastChild.getCardSize() : 1;
  }

  expandGroups(hass, config) {
    // Expanded list of entities to return
    const entities = []

    // Just bail if we're missing something
    if(!config || !config.group || !hass || !hass.states || !hass.states[config.group]) {
      return entities
    }

    // Queue of entities to process
    // Seed the queue with all the entities for the configured group
    const unprocessed_entities = hass.states[config.group].attributes['entity_id'].slice()
  
    // Track the groups we've processed to prevent an infinite loop
    // in case a group is nested in itself or two groups contain each other
    const processed_group_set = new Set()


    // Process each unprocessed entity
    while(unprocessed_entities.length > 0) {
      // Remove the first item in the queue
      const entity = unprocessed_entities.shift()
  
      // If the item to process is a group that we haven't seen yet
  	  // then look up that group in the hass state
  	  // and add all of its entities to the end of the queue
      if(entity.startsWith("group.") && !processed_group_set.has(entity)) {
        processed_group_set.add(entity)

        const group_entities = hass.states[entity].attributes['entity_id']
        for(let ge of group_entities) {
          unprocessed_entities.push(ge)
        }
      } else {
  	    // If it's not a group then just push it on our final list of entities
        entities.push(entity)
      }
    }

	return entities
  }
}

customElements.define('group-card', GroupCard);
