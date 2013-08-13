basedir = '../'

describe 'Elastic Integration', ->
  beforeEach ->
    console.log('huhu')

  it 'First test', ->
    console.log('hihi')
    expect('this').toEqual('this')

  it 'process_data', ->
    process_data("foo", { })
