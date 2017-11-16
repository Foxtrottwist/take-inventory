import React, { Component } from 'react'
import { ScrollView, Alert, AsyncStorage } from 'react-native'
import { List, ListItem, Icon, Button } from 'react-native-elements'
import { LISTS, DROP_BOX } from 'react-native-dotenv'
import axios from 'axios'

import * as XLSX from 'xlsx'
import RNFetchBlob from 'react-native-fetch-blob'
import { writeFile, DocumentDirectoryPath } from 'react-native-fs'
const DDP = `${DocumentDirectoryPath}/`
const output = str => str

class ListIndex extends Component {
  state = {
    availableLists: [],
    countedList: [],
    hasBeenExported: false,
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

  exportList = () => {
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

  onSaveList = list => {
    // the same as this.state.countedList.concat(counted)
    const countedList = [...this.state.countedList, ...list]
    this.setState(() => ({ countedList }))
    AsyncStorage.setItem('inventory', JSON.stringify(countedList))
  }

  onRemovePreviousInventory = () => {
    AsyncStorage.removeItem('inventory')
    this.setState(() => ({ countedList: [] }))
  }

  onSettingsNavigate = () => {
    this.props.navigation.navigate('Settings', {
      onRemovePreviousInventory: this.onRemovePreviousInventory,
    })
  }

  onSelectInventory() {
    this.props.navigation.navigate('IventoryList', {
      countedList: this.state.countedList,
      exportList: this.exportList,
    })
  }

  onListSelect(title, list) {
    this.props.navigation.navigate('Lists', { title, list, onSaveList: this.onSaveList })
  }

  componentWillMount() {
    AsyncStorage.getItem('inventory').then(value => {
      if (value) {
        savedInventory = JSON.parse(value)
        this.setState(() => ({ countedList: savedInventory }))
      } else {
        this.setState(() => ({ countedList: [] }))
      }
    })
  }

  componentDidMount() {
    axios
      .get(LISTS)
      .then(res => this.setState({ availableLists: res.data }))
      .catch(err => console.log(err))
  }

  renderAvailableLists() {
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
    return (
      <ScrollView>
        <Button
          onPress={() => this.onSettingsNavigate()}
          raised
          backgroundColor="#777"
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
