import React from 'react'
import { StackNavigator } from 'react-navigation'

import ListIndex from '../components/ListIndex'
import ActiveList from '../components/ActiveList'
import Inventory from '../components/Inventory'
import SettingsMenu from '../components/SettingsMenu'

const ListStack = StackNavigator({
  Index: {
    screen: ListIndex,
    navigationOptions: {
      title: 'Take Inventory',
    },
  },
  Lists: {
    screen: ActiveList,
    navigationOptions: ({ navigation }) => ({
      title: `${navigation.state.params.title}`,
    }),
  },
  IventoryList: {
    screen: Inventory,
    navigationOption: {
      title: 'Current Inventory',
    },
  },
})

const SettingsStack = StackNavigator({
  Settings: {
    screen: SettingsMenu,
    navigationOptions: {
      title: 'Settings',
    },
  },
})

const Root = StackNavigator(
  {
    ListView: {
      screen: ListStack,
    },
    Settings: {
      screen: SettingsStack,
    },
  },
  {
    mode: 'modal',
    headerMode: 'none',
  },
)

export default Root
