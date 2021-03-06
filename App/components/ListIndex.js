import React, { Component } from 'react'
import { ScrollView, Alert, AsyncStorage, RefreshControl } from 'react-native'
import { List, ListItem, Icon, Button } from 'react-native-elements'
import { LISTS, LOGOUT, DROP_BOX } from 'react-native-dotenv'
import axios from 'axios'
import mapKeys from 'lodash/mapKeys'
import omit from 'lodash/omit'
import map from 'lodash/map'

import * as XLSX from 'xlsx'
import RNFetchBlob from 'react-native-fetch-blob'
import { writeFile, DocumentDirectoryPath } from 'react-native-fs'
const DDP = `${DocumentDirectoryPath}/`
const output = str => str

class ListIndex extends Component {
  state = {
    availableLists: [],
    countedList: [],
    refreshing: false,
  }

  uploadList = file => {
    RNFetchBlob.fetch(
      'POST',
      'https://content.dropboxapi.com/2/files/upload',
      {
        // dropbox upload headers
        Authorization: `Bearer ${DROP_BOX}`,
        'Dropbox-API-Arg': JSON.stringify({
          path: '/Take Inventory/inventory.xlsx',
          mode: 'add',
          autorename: true,
          mute: false,
        }),
        'Content-Type': 'application/octet-stream',
        // Change BASE64 encoded data to a file path with prefix `RNFetchBlob-file://`.
        // Or simply wrap the file path with RNFetchBlob.wrap().
      },
      RNFetchBlob.wrap(file),
    )
      .then(res => {
        console.log(res.text())
      })
      .catch(err => {
        Alert.alert('exportFile Error', `Error ${err.message}`)
      })
  }

  onExportList = () => {
    const counted = this.state.countedList.map(item => [item.inventoryItem, item.count])
    /* convert AOA to worksheet */
    const ws = XLSX.utils.aoa_to_sheet(counted)

    /* build new workbook */
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory')

    /* write file */
    const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' })
    const file = `${DDP}inventory.xlsx`
    writeFile(file, output(wbout), 'ascii')
      .then(res => {
        Alert.alert('exportFile success', `Exported to ${file}`)
      })
      .then(() => this.uploadList(file))
      .catch(err => {
        Alert.alert('exportFile Error', `Error ${err.message}`)
      })
  }

  filterAndUpdate = list => {
    const newItems = list.map(item => item._id)
    const oldItems = mapKeys(this.state.countedList, '_id')
    const filteredItems = omit(oldItems, newItems)
    const newList = [...map(filteredItems), ...list]
    return newList
  }

  onSaveList = list => {
    const countedList = this.state.countedList < 0 ? [...list] : [...this.filterAndUpdate(list)]
    this.setState(() => ({ countedList }))
    AsyncStorage.setItem('inventory', JSON.stringify(countedList))
    this.props.navigation.goBack(null)
  }

  onRemovePreviousInventory = () => {
    AsyncStorage.removeItem('inventory')
    this.setState(() => ({ countedList: [] }))
    this.props.navigation.goBack(null)
  }

  onPressLogout = () => {
    axios
      .get(LOGOUT)
      .then(this.props.navigation.goBack(null))
      .catch(error => console.log(error))
  }

  onSettingsNavigate = () => {
    const titles = this.state.availableLists.map(list => list.title)
    this.props.navigation.navigate('Settings', {
      titles,
      onPressLogout: this.onPressLogout,
      onRemovePreviousInventory: this.onRemovePreviousInventory,
    })
  }

  onSelectInventory() {
    this.props.navigation.navigate('IventoryList', {
      countedList: this.state.countedList,
      onExportList: this.onExportList,
    })
  }

  onListSelect(title, list) {
    this.props.navigation.navigate('Lists', { title, list, onSaveList: this.onSaveList })
  }

  onRefresh() {
    this.setState({ refreshing: true })
    axios
      .get(LISTS)
      .then(res => this.setState({ availableLists: res.data }))
      .then(() => {
        this.setState({ refreshing: false })
      })
      .catch(() => this.props.navigation.navigate('Login'))
  }

  componentWillMount() {
    AsyncStorage.getItem('inventory')
      .then(value => {
        if (!value) {
          this.setState(() => ({ countedList: [] }))
        } else {
          savedInventory = JSON.parse(value)
          this.setState(() => ({ countedList: savedInventory }))
        }
      })
      .catch(err => {
        if (err) {
          this.setState(() => ({ countedList: [] }))
        }
      })
  }

  componentDidMount() {
    axios
      .get(LISTS)
      .then(res => this.setState({ availableLists: res.data }))
      .catch(() => this.props.navigation.navigate('Login'))
  }

  renderAvailableLists() {
    return (
      <List>
        {this.state.availableLists
          .sort((a, b) => a.title.toLowerCase() > b.title.toLowerCase())
          .map(({ title, _id, list, dateCreated }) => (
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
    return (
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={this.state.refreshing} onRefresh={() => this.onRefresh()} />
        }
      >
        <Button
          onPress={() => this.onSettingsNavigate()}
          buttonStyle={{ marginTop: 20 }}
          containerViewStyle={{ borderRadius: 3 }}
          borderRadius={3}
          raised
          backgroundColor="#545454"
          title="Settings"
          icon={{ name: 'ios-settings-outline', type: 'ionicon' }}
        />
        <List>
          <ListItem
            title="Inventory"
            subtitle={`Items Counted: ${this.state.countedList.length}`}
            onPress={() => this.onSelectInventory()}
          />
        </List>
        {this.renderAvailableLists()}
      </ScrollView>
    )
  }
}

export default ListIndex
