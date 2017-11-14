import React, { Component } from 'react'
import { ScrollView } from 'react-native'
import { List, ListItem } from 'react-native-elements'
import { LISTS } from 'react-native-dotenv'
import axios from 'axios'

class ListIndex extends Component {
  state = {
    availableLists: [],
  }

  onListSelect(title, list) {
    this.props.navigation.navigate('List', { title, list })
  }

  componentDidMount() {
    axios
      .get(LISTS)
      .then(res => this.setState({ availableLists: res.data }))
      .catch(err => console.log(err))
  }

  renderLists() {
    return (
      <List>
        {this.state.availableLists.map(({ title, _id, list, dateCreated }) => (
          <ListItem
            key={_id}
            title={title}
            subtitle={`Created on: ${new Date(dateCreated).toLocaleDateString()}`}
            onPress={() => this.onListSelect(title, list)}
          />
        ))}
      </List>
    )
  }

  render() {
    return <ScrollView>{this.renderLists()}</ScrollView>
  }
}

export default ListIndex
