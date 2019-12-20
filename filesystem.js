// This file is a copy from the prototype written in the summer of 2014
// by markdittmer.
// TODO(ebeach): This needs to be majorily refactored to meet Google3 style.

// TODO: We should get a file system DAO for this.
// TODO: We need to clear the directory first, then write files.
// TODO: We need better error handling here.
// TODO: We currently don't provide the user with any feedback when an export
// completes.

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'export' && request.sources) {
    var cfs = chrome.fileSystem;
    var sources = request.sources;
    // Let user pick a directory.
    cfs.chooseEntry(
        {
          type: 'openDirectory',
          suggestedName: 'chrome-app',
          accepts: [{
            description: 'Select a folder for Chrome app export'
          }]
        },
        function(sources, dirEntry, fileEntries) {
          console.log('Directory loaded');
          if (chrome.runtime.lastError) {
            sendResponse({ status: 'failed' });
          }

          // TODO: Is this step necessary?
          // Get a writable handle for chosen directory.
          cfs.getWritableEntry(dirEntry, function(sources, writableEntry) {
            console.log('Writable directory loaded');
            if (chrome.runtime.lastError) {
              sendResponse({ status: 'failed' });
            }

            // First, load/create all necessary sub-directories.
            loadDirs.call(
                this,
                sources,
                writableEntry,
                // Then, load/create all files.
                loadFiles.bind(
                    this,
                    sources,
                    function() {
                      // Entire writing of folder is complete.
                      console.log('Creating files complete');
                    },
                    function() {
                      console.log('Error creating files');
                    }
                ),
                function() { console.log('Error creating dirs'); }
            );
          }.bind(this, sources));
        }.bind(this, sources)
    );
    sendResponse({ status: 'started' });
  } else {
    sendResponse({ status: 'unknown message' });
  }
});

// Load directories needed by path names that are keys of |sources|.
function loadDirs(sources, rootDirEntry, callback, err_callback) {
  var dirs = {__dirEntry__: rootDirEntry};
  var dirRequests = 0;
  var dirResponses = 0;
  var dirDoneRequesting = false;
  for (var fileName in sources) {
    var path = fileName.split('/');
    var dirPath = path.splice(0, path.length - 1);
    var curDir = dirs;
    dirPath.forEach(function(dirName) {
      if (!curDir[dirName]) {
        curDir[dirName] = {};
      }
      curDir = curDir[dirName];
    });
  }
  var data = {
    requests: 0,
    responses: 0,
    requestsSent: false,
    dirs: dirs
  };
  loadDirsBF.call(this, data, dirs, callback, err_callback);
  data.requestsSent = true;
}

// Given the directory structure we intend to load, is it loaded yet?
function dirsAreLoaded(dirs) {
  if (!dirs.__dirEntry__) return false;
  for (var dirName in dirs) {
    if (dirName === '__dirEntry__') continue;
    if (!dirsAreLoaded.call(this, dirs[dirName])) return false;
  }
  return true;
}

// Load directories in a breadth-first pattern.
function loadDirsBF(data, dirs, callback, err_callback) {
  // console.assert(dirs.__dirEntry__);
  for (var dirName in dirs) {
    if (dirName === '__dirEntry__') continue;
    ++data.requests;
    dirs.__dirEntry__.getDirectory(
        dirName,
        { create: true },
        function(dirName, dirs, newDirEntry) {
          ++data.responses;
          dirs[dirName].__dirEntry__ = newDirEntry;
          if (dirsAreLoaded.call(this, data.dirs)) {
            callback(data.dirs);
          }
          loadDirsBF.call(this, data, dirs[dirName], callback, err_callback);
        }.bind(this, dirName, dirs),
        err_callback
    );
  }
}

function loadFiles(sources, callback, err_callback, dirs) {
  var numSources = 0;
  for (var key in sources) ++numSources;
  var sourceWriteCount = 0;
  var sourceFailCount = 0;
  var onWriteError = function(e) {
    console.log('Write error');
    ++sourceFailCount;
    if (sourceWriteCount + sourceFailCount >= numSources)
      console.log('Done writing files');
  }.bind(this);
  var onWriteCompleted = function(e) {
    console.log('Write completed');
    ++sourceWriteCount;
    if (sourceWriteCount + sourceFailCount >= numSources) {
      console.log('Done writing files');
      callback.call(this);
    }
  }.bind(this);

  for (var path in sources) {
    var pathParts = path.split('/');
    var dirPath = pathParts.splice(0, pathParts.length - 1);
    var fileName = pathParts[pathParts.length - 1];
    var curDir = dirs;
    dirPath.forEach(function(dirName) {
      curDir = curDir[dirName];
    }.bind(this));
    var dirEntry = curDir.__dirEntry__;
    dirEntry.getFile(
        fileName,
        { create: true },
        function(fileName, source, dirEntry, fileEntry) {
          console.log('Got file ', fileName);
          fileEntry.createWriter(
              function(fileName, source, dirEntry, fileTruncateWriter) {
                console.log('got file truncate writer', fileName);

                fileTruncateWriter.onwriteend = function() {
                  dirEntry.getFile(
                      fileName,
                      {create: true},
                      function(fileName, source, fileEntry) {
                        fileEntry.createWriter(
                            function(fileName, source, fileWriter) {
                              console.log('Got file writer ', fileName);
                              fileWriter.onwriteend = onWriteCompleted;
                              fileWriter.onerror = onWriteError;
                              var blob;
                              if (fileName.substr(-3).toLowerCase() == 'png') {
                                console.log('intercept png');
                                var arrayBuffer = new Uint8Array(source).buffer;
                                blob = new Blob([arrayBuffer],
                                    {type: 'image/png'});
                              } else {
                                blob = new Blob([source], {type: 'text/plain'});
                              }
                              fileWriter.write(blob);
                            }.bind(this, fileName, source))
                      }.bind(this, fileName, source));
                };
                fileTruncateWriter.onerror = onWriteError;
                fileTruncateWriter.truncate(0);
              }.bind(this, fileName, dirEntry, source),
              onWriteError
          );
        }.bind(this, fileName, dirEntry, sources[path]),
        onWriteError
    );
  }
}
